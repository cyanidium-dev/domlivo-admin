"""Stage 1 of the photo engine: per-photo features, computed locally on the GPU.

For every thumbnail in thumbs/ (written by download-thumbs.mjs) it stores:
  - perceptual hashes (pHash, dHash) for near-identical copies;
  - a zero-shot photo class from SigLIP (interior, balcony sea view, facade, drone, render, ...);
  - a DINOv2 global descriptor (CLS + GeM of patch tokens, L2-normalised) for
    "same place, other angle" retrieval.

Outputs (next to this file):
  features.npz        assets[], dino[N, 1536] float16, siglip_probs[N, C] float16, phash[N] uint64, dhash[N] uint64
  photo-classes.json  {asset: {"cls": label, "p": prob}}

Run: .venv/Scripts/python.exe -I features.py
"""
import json
import os
import sys
from pathlib import Path

import imagehash
import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModel, AutoProcessor

HERE = Path(__file__).resolve().parent
# data (thumbnails, features, groups) stays out of git, in the workspace next to the repo
DATA = Path(os.environ.get("GEO_ENGINE_DATA") or HERE.parents[2] / "domlivo-workspace" / "geo" / "photo-engine")
THUMBS = DATA / "thumbs"
OUT_NPZ = DATA / "features.npz"
OUT_CLS = DATA / "photo-classes.json"

# label -> prompts (several phrasings, averaged)
CLASSES = {
    "interior": [
        "a photo of an apartment living room interior",
        "a photo of a bedroom",
        "a photo of a kitchen",
        "a photo of a bathroom",
        "a photo of an empty room with bare walls",
    ],
    "view_sea": [
        "a view of the sea from a balcony",
        "a view of the sea and the beach from a window",
        "a photo of the sea horizon taken from a high floor",
    ],
    "view_city": [
        "a view from a balcony over city streets and apartment buildings",
        "a view from a window of neighbouring buildings and rooftops",
    ],
    "balcony": ["a photo of a balcony or terrace of an apartment"],
    "facade": [
        "a photo of the facade of an apartment building taken from the street",
        "a photo of a residential building exterior",
        "a street with apartment buildings",
    ],
    "aerial": [
        "an aerial drone photo of buildings near the coast",
        "an aerial photo of a town from above",
    ],
    "render": [
        "a 3D architectural rendering of a modern residential building",
        "a computer generated visualisation of an apartment complex",
    ],
    "plan": ["a floor plan drawing of an apartment", "an architectural floor plan"],
    "construction": [
        "a building under construction with concrete frame and scaffolding",
        "a construction site with a crane",
    ],
    "common": [
        "a building entrance hall, lobby or staircase",
        "an elevator lobby in an apartment building",
    ],
    "amenity": [
        "a swimming pool of a residential complex",
        "a garden or courtyard of a residential complex",
    ],
    "beach": ["a photo of a sandy beach with umbrellas", "a seaside promenade with palm trees"],
    "graphic": ["a poster or advertisement with text and logo", "a map or a document"],
}

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32


def as_tensor(out):
    """transformers 5 returns an output object from get_*_features, 4.x a tensor."""
    if isinstance(out, torch.Tensor):
        return out
    return out.pooler_output if getattr(out, "pooler_output", None) is not None else out[0]


def load_images(paths):
    imgs = []
    for p in paths:
        try:
            im = Image.open(p)
            im = im.convert("RGB")
            imgs.append(im)
        except Exception as e:  # corrupt download
            print("bad image", p, e, file=sys.stderr)
            imgs.append(Image.new("RGB", (64, 64)))
    return imgs


def main():
    files = sorted(THUMBS.glob("*.jpg"))
    assets = [f.stem for f in files]
    print(f"{len(files)} thumbnails on {device}")

    sig_name = "google/siglip-base-patch16-224"
    sig_proc = AutoProcessor.from_pretrained(sig_name)
    sig = AutoModel.from_pretrained(sig_name, torch_dtype=dtype).to(device).eval()
    labels = list(CLASSES)
    prompts = [p for l in labels for p in CLASSES[l]]
    owner = [i for i, l in enumerate(labels) for _ in CLASSES[l]]
    with torch.no_grad():
        t = sig_proc(text=prompts, padding="max_length", return_tensors="pt").to(device)
        tf = as_tensor(sig.get_text_features(**t))
        tf = torch.nn.functional.normalize(tf.float(), dim=-1)
    # average prompts per label
    T = torch.zeros(len(labels), tf.shape[1], device=device)
    for k, i in enumerate(owner):
        T[i] += tf[k]
    T = torch.nn.functional.normalize(T, dim=-1)

    dino_name = "facebook/dinov2-base"
    dino_proc = AutoImageProcessor.from_pretrained(dino_name)
    dino = AutoModel.from_pretrained(dino_name, torch_dtype=dtype).to(device).eval()

    N = len(files)
    dino_out = np.zeros((N, 1536), dtype=np.float16)
    probs_out = np.zeros((N, len(labels)), dtype=np.float16)
    ph = np.zeros(N, dtype=np.uint64)
    dh = np.zeros(N, dtype=np.uint64)

    B = 32
    for s in range(0, N, B):
        batch = files[s : s + B]
        imgs = load_images(batch)
        for k, im in enumerate(imgs):
            ph[s + k] = int(str(imagehash.phash(im)), 16)
            dh[s + k] = int(str(imagehash.dhash(im)), 16)
        with torch.no_grad():
            px = sig_proc(images=imgs, return_tensors="pt")["pixel_values"].to(device, dtype)
            iff = torch.nn.functional.normalize(as_tensor(sig.get_image_features(pixel_values=px)).float(), dim=-1)
            logits = iff @ T.T * sig.logit_scale.exp().float()
            probs_out[s : s + len(batch)] = torch.softmax(logits, dim=-1).cpu().numpy()

            dp = dino_proc(images=imgs, return_tensors="pt")["pixel_values"].to(device, dtype)
            h = dino(pixel_values=dp).last_hidden_state.float()
            cls = torch.nn.functional.normalize(h[:, 0], dim=-1)
            patches = h[:, 1:].clamp(min=1e-6)
            gem = patches.pow(3).mean(dim=1).pow(1 / 3)
            gem = torch.nn.functional.normalize(gem, dim=-1)
            dino_out[s : s + len(batch)] = torch.cat([cls, gem], dim=-1).cpu().numpy() / np.sqrt(2)
        if (s // B) % 20 == 0:
            print(f"…{s + len(batch)}/{N}", flush=True)

    np.savez_compressed(OUT_NPZ, assets=np.array(assets), dino=dino_out, siglip_probs=probs_out, phash=ph, dhash=dh, labels=np.array(labels))
    cls = {}
    for i, a in enumerate(assets):
        j = int(np.argmax(probs_out[i]))
        cls[a] = {"cls": labels[j], "p": round(float(probs_out[i, j]), 3)}
    OUT_CLS.write_text(json.dumps(cls))
    counts = {}
    for v in cls.values():
        counts[v["cls"]] = counts.get(v["cls"], 0) + 1
    print("classes:", dict(sorted(counts.items(), key=lambda x: -x[1])))


if __name__ == "__main__":
    main()
