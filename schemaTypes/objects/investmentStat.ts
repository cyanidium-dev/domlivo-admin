import {defineType, defineField} from 'sanity'

export const investmentStat = defineType({
  name: 'investmentStat',
  title: 'Investment Stat',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'localizedString'}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'value', title: 'Value', type: 'localizedString'}),
    defineField({name: 'description', title: 'Description', type: 'localizedText'}),
  ],
  preview: {
    select: {labelEn: 'label.en', titleEn: 'title.en', valueEn: 'value.en'},
    prepare({labelEn, titleEn, valueEn}: {labelEn?: string; titleEn?: string; valueEn?: string}) {
      return {title: labelEn || titleEn || 'Stat', subtitle: valueEn || ''}
    },
  },
})

