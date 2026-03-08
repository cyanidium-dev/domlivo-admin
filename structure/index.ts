import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home Page')
        .id('homePage')
        .child(S.document().schemaType('homePage').documentId('homePage')),

      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),

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
              S.documentTypeListItem('blogCategory').title('Categories'),
              S.documentTypeListItem('blogPost').title('Posts'),
            ]),
        ),
    ])
