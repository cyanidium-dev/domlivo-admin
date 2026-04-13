import type {StructureResolver} from 'sanity/structure'

type AccessDoc = {
  role?: 'admin' | 'editor' | 'agent'
  linkedAgent?: {_ref?: string}
  active?: boolean
}

function isAdminUser(currentUser?: {roles?: {name?: string}[]}): boolean {
  return (currentUser?.roles ?? []).some((role) => role.name === 'administrator')
}

function blogItem(S: Parameters<StructureResolver>[0]) {
  return S.listItem()
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
            .child(S.document().schemaType('blogSettings').documentId('blog-settings')),
        ]),
    )
}

function landingPagesItem(S: Parameters<StructureResolver>[0]) {
  return S.listItem()
    .title('Landing Pages')
    .child(
      S.list()
        .title('Landing Pages')
        .items([
          S.listItem().title('All Landing Pages').child(S.documentTypeList('landingPage').title('All Landing Pages')),
          S.divider(),
          S.listItem().title('City Landings').child(S.documentTypeList('landingPage').filter('_type == "landingPage" && pageType == "city"')),
          S.listItem()
            .title('Cities Index Landing (country/city editorial)')
            .id('landingCitiesIndex')
            .child(S.document().schemaType('landingPage').documentId('landing-cities')),
          S.listItem().title('District Landings').child(S.documentTypeList('landingPage').filter('_type == "landingPage" && pageType == "district"')),
          S.listItem()
            .title('Property Type Landings')
            .child(S.documentTypeList('landingPage').filter('_type == "landingPage" && pageType == "propertyType"')),
          S.listItem()
            .title('Investment Landings')
            .child(S.documentTypeList('landingPage').filter('_type == "landingPage" && pageType == "investment"')),
          S.listItem()
            .title('Custom Landings')
            .child(S.documentTypeList('landingPage').filter('_type == "landingPage" && pageType == "custom"')),
        ]),
    )
}

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Workspace')
        .child(async () => {
          const currentUserId = context.currentUser?.id
          const adminByStudioRole = isAdminUser(context.currentUser)

          let access: AccessDoc | null = null
          if (currentUserId && context.getClient) {
            const client = context.getClient({apiVersion: '2024-06-01'})
            access = await client.fetch(
              `*[_type == "studioUserAccess" && userId == $userId && active != false][0]{role, linkedAgent, active}`,
              {userId: currentUserId},
            )
          }

          const role = adminByStudioRole ? 'admin' : access?.role ?? 'editor'
          const linkedAgentId = access?.linkedAgent?._ref

          if (role === 'agent') {
            return S.list()
              .title('Agent Workspace')
              .items([
                S.listItem()
                  .title('My Profile')
                  .child(
                    linkedAgentId
                      ? S.document().schemaType('agent').documentId(linkedAgentId)
                      : S.documentTypeList('agent').title('My Profile').filter('_type == "agent" && false'),
                  ),
                S.listItem()
                  .title('My Properties')
                  .child(
                    S.documentTypeList('property')
                      .title('My Properties')
                      .apiVersion('2024-06-01')
                      .filter('_type == "property" && agent._ref == $agentId')
                      .params({agentId: linkedAgentId ?? '__missing_agent__'})
                      .defaultOrdering([{field: 'createdAt', direction: 'desc'}]),
                  ),
                S.listItem()
                  .title('My Leads')
                  .child(
                    S.documentTypeList('propertyLead')
                      .title('My Leads')
                      .apiVersion('2024-06-01')
                      .filter('_type == "propertyLead" && linkedAgent._ref == $agentId')
                      .params({agentId: linkedAgentId ?? '__missing_agent__'})
                      .defaultOrdering([{field: 'createdAt', direction: 'desc'}]),
                  ),
              ])
          }

          if (role === 'editor') {
            return S.list()
              .title('Editorial Workspace')
              .items([
                S.listItem()
                  .title('Home Landing')
                  .id('landingHome')
                  .child(S.document().schemaType('landingPage').documentId('landing-home')),
                landingPagesItem(S),
                S.listItem()
                  .title('Catalog SEO Pages')
                  .child(
                    S.documentTypeList('catalogSeoPage')
                      .title('Catalog SEO Pages')
                      .defaultOrdering([{field: 'pageScope', direction: 'asc'}]),
                  ),
                blogItem(S),
              ])
          }

          return S.list()
            .title('Admin Workspace')
            .items([
              S.listItem()
                .title('Home Landing')
                .id('landingHome')
                .child(S.document().schemaType('landingPage').documentId('landing-home')),
              landingPagesItem(S),
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
              S.listItem()
                .title('Registration Requests')
                .id('registrationRequests')
                .child(
                  S.documentTypeList('registrationRequest')
                    .title('Registration Requests')
                    .initialValueTemplates([S.initialValueTemplateItem('registration-request-default')])
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
                ),
              S.listItem()
                .title('Property Leads')
                .id('propertyLeads')
                .child(
                  S.documentTypeList('propertyLead')
                    .title('Property Leads')
                    .defaultOrdering([{field: 'createdAt', direction: 'desc'}]),
                ),
              S.listItem()
                .title('Studio User Access')
                .id('studioUserAccess')
                .child(
                  S.documentTypeList('studioUserAccess')
                    .title('Studio User Access')
                    .defaultOrdering([{field: 'userId', direction: 'asc'}]),
                ),
              S.divider(),
              S.documentTypeListItem('country').title('Countries'),
              S.listItem()
                .title('Cities')
                .child(
                  S.documentTypeList('city')
                    .title('Cities')
                    .child((cityId) =>
                      S.list()
                        .title('City')
                        .items([
                          S.listItem().title('Edit City').child(S.document().schemaType('city').documentId(cityId)),
                          S.listItem()
                            .title('Districts in this City')
                            .child(
                              S.documentTypeList('district')
                                .title('Districts')
                                .filter('_type == "district" && city._ref == $cityId')
                                .params({cityId})
                                .initialValueTemplates([S.initialValueTemplateItem('district-in-city', {cityId})])
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
                            .params({userId: context.currentUser?.id})
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
              blogItem(S),
            ])
        }),
    ])
