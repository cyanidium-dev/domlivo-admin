import type {StructureResolver} from 'sanity/structure'
import {languages} from '../lib/languages'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home Page')
        .id('homePage')
        .child(
          S.list()
            .title('Home Page')
            .items(
              languages.map((lang) =>
                S.listItem()
                  .title(lang.title)
                  .id(`homePage-${lang.id}`)
                  .child(
                    S.document()
                      .schemaType('homePage')
                      .documentId(`homePage-${lang.id}`)
                      .title(`Home Page (${lang.title})`)
                      .initialValueTemplate(`homePage-${lang.id}`)
                  )
              )
            )
        ),

      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.list()
            .title('Site Settings')
            .items(
              languages.map((lang) =>
                S.listItem()
                  .title(lang.title)
                  .id(`siteSettings-${lang.id}`)
                  .child(
                    S.document()
                      .schemaType('siteSettings')
                      .documentId(`siteSettings-${lang.id}`)
                      .title(`Site Settings (${lang.title})`)
                      .initialValueTemplate(`siteSettings-${lang.id}`)
                  )
              )
            )
        ),

      S.divider(),

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

      S.documentTypeListItem('propertyType').title('Property Types'),

      S.documentTypeListItem('locationTag').title('Location Tags'),

      S.divider(),

      S.documentTypeListItem('agent').title('Agents'),

      S.divider(),

      S.documentTypeListItem('blogPost').title('Blog'),
    ])
