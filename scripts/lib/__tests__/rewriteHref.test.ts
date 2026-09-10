import {describe, expect, it} from 'vitest'
import {rewriteRedirectingHref as rewriteHref} from '../rewriteRedirectingHref'

describe('rewriteHref', () => {
  it('moves a district out of the query and into the path', () => {
    expect(rewriteHref('/albania/tirana/sale?district=myslym-shyri')).toBe(
      '/albania/tirana/myslym-shyri/sale',
    )
    expect(rewriteHref('/albania/durres/rent?district=plazh')).toBe('/albania/durres/plazh/rent')
  })

  it('handles a district with no deal segment', () => {
    expect(rewriteHref('/albania/durres?district=golem-durres')).toBe('/albania/durres/golem-durres')
  })

  it('keeps the other query parameters', () => {
    expect(rewriteHref('/albania/durres/sale?district=plazh&sort=newest')).toBe(
      '/albania/durres/plazh/sale?sort=newest',
    )
  })

  it('turns a catalog city query into the city path', () => {
    expect(rewriteHref('/catalog?city=durres')).toBe('/albania/durres')
    expect(rewriteHref('/catalog?city=durres&district=plazh')).toBe('/albania/durres/plazh')
  })

  it('leaves /catalog queries that have no path form', () => {
    // These answer 200; there is nowhere better to send them.
    expect(rewriteHref('/catalog?investment=1')).toBeNull()
    expect(rewriteHref('/catalog?investment=true')).toBeNull()
  })

  it('leaves paths that already have the district as a segment', () => {
    expect(rewriteHref('/albania/tirana/blloku/sale')).toBeNull()
    expect(rewriteHref('/albania/durres/districts/plazh')).toBeNull()
  })

  it('refuses anything that is not an internal path with a query', () => {
    expect(rewriteHref('https://example.com/albania/durres/sale?district=plazh')).toBeNull()
    expect(rewriteHref('/albania/durres/sale')).toBeNull()
    expect(rewriteHref('')).toBeNull()
  })

  it('does not touch an unrecognised path carrying a district query', () => {
    // Only the catalog shapes are understood; guessing at others would be worse
    // than leaving a redirect in place.
    expect(rewriteHref('/guides/something?district=plazh')).toBeNull()
  })
})
