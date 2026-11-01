import type { VerticalCatalog } from "./catalog";
import { cafeCatalog } from "./cafe";
import { hotelCatalog } from "./hotel";
import { supplyCatalog } from "./supply";
import type { WorkspaceKind } from "./kinds";

const CATALOGS: Record<WorkspaceKind, VerticalCatalog> = {
  cafe: cafeCatalog,
  hotel: hotelCatalog,
  supply: supplyCatalog,
};

export function catalogFor(kind: WorkspaceKind): VerticalCatalog {
  return CATALOGS[kind];
}

export function registeredKinds(): readonly WorkspaceKind[] {
  return Object.keys(CATALOGS) as WorkspaceKind[];
}
