//import { EntityActionType, EntityRegistry } from './types';
//import { setEntity, removeEntity, updateEntity } from './world';
import produce from "immer"
import { CombinedState, combineReducers, Reducer } from 'redux';
import { StoreAction } from "../store";
import { newComponents, removeComponents, componentsReducer, getFilteredEntityIds, removeComponentsMut, setComponentsFromActionMut, insertComponentsBulkMut, maxEntityId } from './components/components';
import { EntityComponent } from "./components/entity";
import { SetAction } from "./components/types";
import { Components, Component, EntityActionType, EntityId, HasTransform, TransformActionType, World, ComponentKeySet, ComponentKey, Target, Weapon } from './types';
import { getEntitiesByType } from "./world";
import { getHeight } from "../heightmap/heightmap";
import { getMortarFiringSolution } from "./projectilePhysics";
import { getTranslation } from "./transformations";


const newWorld = (): World => ({
  nextId: 0,
  components: newComponents(),
})

export const world: Reducer<World, StoreAction> = (state, action) => {
  /* 
    this reducer intercepts entity actions which require modification of across components,
    passing on the rest to a bundle of component-specific reducers 
  */
  if (state === undefined) {
    return newWorld();
  }
  switch (action.type) {
    case EntityActionType.add:
      return produce(state, (proxy: World) => {
        const newId = proxy.nextId;
        proxy.nextId = proxy.nextId + 1;
        let setAction: SetAction = produce(action, (action: any) => {
          action.type = EntityActionType.set;
          action.payload["entityId"] = newId;
        }) as any;
        proxy.components = setComponentsFromActionMut(proxy.components, newId, setAction);
      })
    case EntityActionType.set:
      return produce(state, (proxy: World) => {
        proxy.nextId = Math.max(action.payload.entityId + 1, proxy.nextId);
        proxy.components = setComponentsFromActionMut(proxy.components, action.payload.entityId, action);
      })

    case EntityActionType.setAll:
      return produce(state, (proxy: World) => {
        proxy.nextId = maxEntityId(action.payload.components) + 1;
        proxy.components = insertComponentsBulkMut(newComponents(), action.payload.components);

      })
    case EntityActionType.remove:
      return produce(state, (proxy: World) => {
        proxy.components = removeComponents(proxy.components, action.payload.entityId);
      })
    // for more cases, should generalize selection via entityId to some (serializable) filter function
    case EntityActionType.removeAllTargets:
      const targetIds = getFilteredEntityIds(state.components, (e: EntityComponent) => e.entityType === "Target");
      return produce(state, (proxy: World) => {
        targetIds.forEach((v: EntityId) => {
          removeComponentsMut(proxy.components, v)
        })
      });

    case EntityActionType.syncMap:
      return produce(state, (proxy: World) => {
        const cacheBuster = new Date().getTime();
        const startTime = Date.now();
        const tryFetchImage = () => {
          fetch(`merged/merged_${cacheBuster}.png`, {
            method: 'GET',
            mode: 'no-cors',
          })
            .then((response) => {
              action.payload.state.minimap.texture.image.src = `merged/merged_${cacheBuster}.png`;
            })
            .catch((error) => {
              const currentTime = Date.now();
              if (currentTime - startTime < 20000) {
                // Retry fetching the image after a delay of 1000 ms (1 second)
                setTimeout(tryFetchImage, 1000);
              } else {
                // Fallback to the original image source if retries have exceeded 20 seconds
                action.payload.state.minimap.texture.image.src = action.payload.state.minimap.texture.source;
              }
            });
        };

        fetch("http://localhost:4545/refreshmap/", {
          method: 'POST',
          mode: "no-cors",
          headers: {
            'Content-Type': 'text/plain'
          },
          body: action.payload.state.minimap.texture.source + ";" + cacheBuster
        }).then((response) => {
          tryFetchImage();
        });
      });

    case EntityActionType.syncTargets:
      return produce(state, (proxy: World) => {
        const stateSync = action.payload.state;
        const targets = getEntitiesByType<Target>(stateSync.world, "Target");
        const weapons = getEntitiesByType<Weapon>(stateSync.world, "Weapon")
        const heightmap = stateSync.heightmap;
        let coorArray: string = '';
        targets.forEach((target: Target) => {
          const activeWeapons = weapons.filter((w: Weapon) => w.isActive);
          activeWeapons.forEach((weapon: Weapon, activeWeaponIndex: number) => {
            const weaponTranslation = getTranslation(weapon.transform);
            const weaponHeight = getHeight(heightmap, weaponTranslation)
            weaponTranslation[2] = weaponHeight + weapon.heightOverGround;
            const targetTranslation = getTranslation(target.transform);
            const targetHeight = getHeight(heightmap, targetTranslation)
            targetTranslation[2] = targetHeight;
            const solution = getMortarFiringSolution(weaponTranslation, targetTranslation);
            const angle = solution.dir.toFixed(1);
            const rangeV = solution.milRounded;
            const range = solution.angle ? `${(rangeV.toFixed(1))}` : "-----"
            const dataToSave = `${range},${angle}`;
            if (coorArray !== '') {
              coorArray = coorArray + ';';
            }
            coorArray = coorArray + dataToSave;
          });
        });
        fetch("http://localhost:4545/coordinates", {
          method: 'POST',
          mode: "no-cors",
          headers: {
            'Content-Type': 'text/plain'
          },
          body: coorArray
        })

      });
    default:
      return produce(state, (proxy: World) => {
        proxy.components = componentsReducer(proxy.components, action);
      });
  }
}