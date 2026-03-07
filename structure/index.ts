import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home Page')
        .id('homePage')
        .child(
          S.document()
            .schemaType('homePage')
            .documentId('homePage')
            .title('Home Page')
        ),

      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings')
        ),

      S.divider(),

      S.listItem()
        .title('Cities')
        .child(
          S.documentTypeList('city')
            .title('Cities')
            .defaultOrdering([{field: 'order', direction: 'asc'}, {field: 'title.en', direction: 'asc'}])
        ),

      S.listItem()
        .title('Districts')
        .child(
          S.documentTypeList('district')
            .title('Districts')
            .defaultOrdering([{field: 'order', direction: 'asc'}, {field: 'title.en', direction: 'asc'}])
        ),

      S.divider(),

      S.listItem()
        .title('Properties')
        .child(
          S.list()
            .title('Properties')
            .items([
              // TODO: migrate existing properties to populate ownerUserId
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
                ),

              S.divider(),

              S.documentTypeListItem('property').title('All Properties'),
            ])
        ),

      S.divider(),

      S.documentTypeListItem('propertyType').title('Property Types'),

      S.documentTypeListItem('locationTag').title('Location Tags'),

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
            ])
        ),
    ])
