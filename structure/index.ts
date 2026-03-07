import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Locations')
        .child(
          S.list()
            .title('Locations')
            .items([
              S.documentTypeListItem('city').title('Cities'),
              S.documentTypeListItem('district').title('Districts'),
            ])
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

      S.documentTypeListItem('agent').title('Agents'),

      S.divider(),

      S.documentTypeListItem('blogPost').title('Blog'),
    ])
