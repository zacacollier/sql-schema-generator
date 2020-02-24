import { Entity } from '../../../../types';

const reservedPropertyNames = ['id', 'uuid', 'createdAt', 'updatedAt', 'effectiveAt']; // these columns are autogenerated for managing entities and thus cant be used
export const throwErrorIfAnyReservedPropertyNamesAreUsed = ({ entity }: { entity: Entity }) => {
  const usedPropertyNames = Object.keys(entity.properties);
  usedPropertyNames.forEach((name) => {
    if (reservedPropertyNames.includes(name)) {
      throw new Error(
        `property can not be named "${entity.name}.${name}" because "${name}" is a reserved property name`,
      );
    }
  });
};