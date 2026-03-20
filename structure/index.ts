import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home Landing')
        .id('landingHome')
        .child(
          S.document()
            .schemaType('landingPage')
            .documentId('landing-home'),
        ),

      S.listItem()
        .title('Landing Pages')
        .child(
          S.list()
            .title('Landing Pages')
            .items([
              S.listItem()
                .title('All Landing Pages')
                .child(S.documentTypeList('landingPage').title('All Landing Pages')),
              S.divider(),
              S.listItem()
                .title('City Landings')
                .child(S.documentTypeList('landingPage').filter('_type == "landingPage" && pageType == "city"')),
              S.listItem()
                .title('Cities Index Landing (/cities)')
                .id('landingCitiesIndex')
                .child(S.document().schemaType('landingPage').documentId('landing-cities')),
              S.listItem()
                .title('District Landings')
                .child(S.documentTypeList('landingPage').filter('_type == "landingPage" && pageType == "district"')),
              S.listItem()
                .title('Property Type Landings')
                .child(
                  S.documentTypeList('landingPage').filter(
                    '_type == "landingPage" && pageType == "propertyType"',
                  ),
                ),
              S.listItem()
                .title('Investment Landings')
                .child(
                  S.documentTypeList('landingPage').filter('_type == "landingPage" && pageType == "investment"'),
                ),
              S.listItem()
                .title('Custom Landings')
                .child(
                  S.documentTypeList('landingPage').filter('_type == "landingPage" && pageType == "custom"'),
                ),
            ]),
        ),

      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),

      S.listItem()
        .title('Catalog SEO Pages')
        .child(
          S.documentTypeList('catalogSeoPage')
            .title('Catalog SEO Pages')
            .defaultOrdering([{field: 'pageScope', direction: 'asc'}]),
        ),

      S.divider(),

      S.listItem()
        .title('Cities')
        .child(
          S.documentTypeList('city')
            .title('Cities')
            .child((cityId) =>
              S.list()
                .title('City')
                .items([
                  S.listItem()
                    .title('Edit City')
                    .child(S.document().schemaType('city').documentId(cityId)),

                  S.listItem()
                    .title('Districts in this City')
                    .child(
                      S.documentTypeList('district')
                        .title('Districts')
                        .filter('_type == "district" && city._ref == $cityId')
                        .params({cityId})
                        .initialValueTemplates([
                          S.initialValueTemplateItem('district-in-city', {
                            cityId,
                          }),
                        ])
                        .defaultOrdering([
                          {field: 'order', direction: 'asc'},
                          {field: 'title.en', direction: 'asc'},
                        ]),
                    ),
                ]),
            ),
        ),

      S.listItem()
        .title('All Districts')
        .child(
          S.documentTypeList('district')
            .title('All Districts')
            .defaultOrdering([
              {field: 'order', direction: 'asc'},
              {field: 'title.en', direction: 'asc'},
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Properties')
        .child(
          S.list()
            .title('Properties')
            .items([
              S.listItem()
                .title('My Properties')
                .child(
                  S.documentTypeList('property')
                    .title('My Properties')
                    .apiVersion('2024-06-01')
                    .filter('_type == "property" && ownerUserId == $userId')
                    .params({
                      userId: context.currentUser?.id,
                    })
                    .defaultOrdering([{field: 'createdAt', direction: 'desc'}]),
                ),

              S.divider(),

              S.listItem()
                .title('All Properties')
                .child(
                  S.documentTypeList('property')
                    .title('All Properties')
                    .defaultOrdering([{field: 'createdAt', direction: 'desc'}]),
                ),
            ]),
        ),

      S.divider(),

      S.documentTypeListItem('propertyType').title('Property Types'),

      S.documentTypeListItem('locationTag').title('Location Tags'),

      S.documentTypeListItem('amenity').title('Amenities'),

      S.divider(),

      S.documentTypeListItem('agent').title('Agents'),

      S.divider(),

      S.listItem()
        .title('Blog')
        .child(
          S.list()
            .title('Blog')
            .items([
              S.listItem()
                .title('Posts')
                .child(
                  S.documentTypeList('blogPost')
                    .title('Posts')
                    .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
                ),
              S.listItem()
                .title('Categories')
                .child(
                  S.documentTypeList('blogCategory')
                    .title('Categories')
                    .defaultOrdering([{field: 'order', direction: 'asc'}]),
                ),
              S.listItem()
                .title('Authors')
                .child(
                  S.documentTypeList('blogAuthor')
                    .title('Authors')
                    .defaultOrdering([{field: 'name', direction: 'asc'}]),
                ),
              S.divider(),
              S.listItem()
                .title('Blog Settings')
                .id('blogSettings')
                .child(
                  S.document()
                    .schemaType('blogSettings')
                    .documentId('blog-settings'),
                ),
            ]),
        ),
    ])
