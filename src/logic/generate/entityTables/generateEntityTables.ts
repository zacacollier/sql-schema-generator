import { Entity, Property } from '../../../types';
import { pickKeysFromObject } from '../utils/pickKeysFromObject';
import { generateMappingTablesForArrayProperties } from './generateMappingTablesForArrayProperties';
import { generateTableForCurrentVersionPointer } from './generateTableForCurrentVersionPointer';
import { generateTableForStaticProperties } from './generateTableForStaticProperties';
import { generateTableForUpdateableProperties } from './generateTableForUpdateableProperties';

export const generateEntityTables = ({ entity }: { entity: Entity }) => {
  // 1. separate static -vs- updatable properties, pick out array properties
  const staticProps = pickKeysFromObject({
    object: entity.properties,
    keep: (property: Property) => !property.updatable,
  });
  const updatableProps = pickKeysFromObject({
    object: entity.properties,
    keep: (property: Property) => !!property.updatable,
  });
  const arrayProps = pickKeysFromObject({
    object: entity.properties,
    keep: (property: Property) => !!property.array,
  });

  // 2. validate the props
  // TODO: throw error if the unique constraint has dynamic properties

  // 3. define the sql
  const entityTable = generateTableForStaticProperties({
    entityName: entity.name,
    unique: entity.unique,
    properties: staticProps,
  });
  const entityVersionTable = Object.keys(updatableProps).length
    ? generateTableForUpdateableProperties({ entityName: entity.name, properties: updatableProps })
    : undefined;
  const entityCurrentVersionPointerTable = entityVersionTable
    ? generateTableForCurrentVersionPointer({ entityName: entity.name })
    : undefined;
  const mappingTables = generateMappingTablesForArrayProperties({ entityName: entity.name, properties: arrayProps });

  // 4. remove the string
  return {
    static: entityTable,
    version: entityVersionTable,
    currentVersionPointer: entityCurrentVersionPointerTable,
    mappings: mappingTables,
  };
};
