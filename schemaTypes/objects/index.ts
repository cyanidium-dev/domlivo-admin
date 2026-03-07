import {seo} from './seo'
import {faqItem} from './faqItem'
import {ctaLink} from './ctaLink'
import {socialLink} from './socialLink'
import {footerLink} from './footerLink'
import {districtStat} from './districtStat'
import {districtMetric} from './districtMetric'
import {localizedString} from './localizedString'
import {localizedText} from './localizedText'

/**
 * Object types (embeddable/reusable)
 * Add new object schemas here.
 */
export const objects = [
  seo,
  faqItem,
  ctaLink,
  socialLink,
  footerLink,
  districtStat,
  districtMetric,
  localizedString,
  localizedText,
]

export {languageField} from './languageField'
