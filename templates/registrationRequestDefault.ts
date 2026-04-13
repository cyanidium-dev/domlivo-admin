import type {Template} from 'sanity'

/**
 * Default values when creating a registration request from the desk.
 * Ensures `status` is never missing on new Studio documents (avoids empty radio / validation issues).
 */
export const registrationRequestDefaultTemplate: Template = {
  id: 'registration-request-default',
  title: 'Registration request',
  schemaType: 'registrationRequest',
  value: () => ({
    status: 'pending',
  }),
}
