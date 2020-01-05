import { Entity, prop, ValueObject } from '../module';

const photo = new ValueObject({
  name: 'photo',
  properties: {
    url: prop.VARCHAR(255),
  },
});
const user = new Entity({
  name: 'user',
  properties: {
    phone_number: prop.CHAR(10), // only us numbers allowed
    first_name: prop.VARCHAR(255),
    last_name: prop.VARCHAR(255),
    avatar_id: {
      ...prop.REFERENCES(photo),
      updatable: true,
    },
  },
  unique: ['phone_number'], // users are identified by their phone number
});
const host = new Entity({
  name: 'host',
  properties: {
    tax_id: prop.VARCHAR(255),
    owner_id: prop.REFERENCES(user),
    contact_id: {
      ...prop.REFERENCES(user),
      updatable: true,
    },
  },
  unique: ['tax_id'], // hosts are identified by their tax ids
});
const home = new Entity({
  name: 'home',
  properties: {
    name: prop.VARCHAR(255),
    host_ids: prop.ARRAY_OF(prop.REFERENCES(host)), // one home may have more than one host (for some reason in this example... just go with it)
    photo_ids: {
      ...prop.ARRAY_OF(prop.REFERENCES(photo)),
      updatable: true, // the photos of a home change over time
    },
  },
  unique: ['name', 'host_ids'],
});

export const entities = [photo, user, host, home];
