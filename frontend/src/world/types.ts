
import { vec3, mat4 } from 'gl-matrix';
import { EntityComponent, EntityType } from './components/entity';
import { WeaponComponent } from './components/weapon';

export type HasEntityId = {entityId: EntityId}
export type HasTransform = {transform: Transform}
export type Transform = mat4 //HasLocation & HasRotation & HasScale;

export type HasLocation = {location: vec3}
export type HasRotation = {rotation: vec3}
export type HasScale = {scale: vec3}
export type WorldArea = {
  
}

export enum EntityActionType {
  add               = "ENTITY_ADD",
  set               = "ENTITY_SET",
  setAll            = "ENTITY_SET_ALL",
  remove            = "ENTITY_REMOVE",
  removeAllTargets  = "ENTITY_REMOVE_ALL_TARGETS",
  syncTargets       = "SYNC_TARGETS",
  syncMap       = "SYNC_MAP",
}

export type EntityAction = 
    {type: EntityActionType.add, payload: HasLocation & {entityType: EntityType}}
  | {type: EntityActionType.set, payload: HasLocation & {entityType: EntityType, entityId: EntityId}}
  | {type: EntityActionType.setAll, payload: {components: SerializableComponents}}
  | {type: EntityActionType.remove, payload: HasEntityId}
  | {type: EntityActionType.removeAllTargets, payload: {}}
  | {type: EntityActionType.syncTargets, payload: {state: any}}
  | {type: EntityActionType.syncMap, payload: {state: any}}


export enum TransformActionType {
  moveTo = "TRANSFORM_MOVE_TO",
  moveBy = "TRANSFORM_MOVE_BY"
}

export type TransformAction = 
    {type: TransformActionType.moveTo, payload: {entityId: EntityId, location: vec3}}
  | {type: TransformActionType.moveBy, payload: {entityId: EntityId, vector: vec3}}

export type Component = 
    HasTransform
  | WeaponComponent
  | EntityComponent

export enum WeaponActionType {
  setActive = "WEAPON_SET_ACTIVE",
  toggleActive = "WEAPON_TOGGLE_ACTIVE",
  pickActive = "WEAPON_PICK_ACTIVE",
  setHeightOverGround = "WEAPON_SET_HEIGHT_OVER_GROUND",
}

export type WeaponAction = 
    {type: WeaponActionType.setActive, payload: {entityId: EntityId, newState: boolean}}
  | {type: WeaponActionType.toggleActive, payload: {entityId: EntityId}}
  | {type: WeaponActionType.pickActive, payload: {entityId: EntityId}}
  | {type: WeaponActionType.setHeightOverGround, payload: {entityId: EntityId, newHeight: number}}

export type ComponentDefinition
  = {componentKey: "transform"} & HasTransform

export type Components = {
  transform: Map<EntityId, HasTransform>;
  weapon: Map<EntityId, WeaponComponent>;
  entity: Map<EntityId, EntityComponent>;
}
export type ComponentKey = keyof Components
export type ComponentKeySet = Set<ComponentKey>

export type EntityId = number
export type World = {
  nextId: EntityId;
  components: Components
}

export type Target = EntityComponent & HasTransform
export type Weapon = EntityComponent & WeaponComponent & HasTransform

export type SerializableComponents = {[k in ComponentKey]: Array<[EntityId, Component]>};