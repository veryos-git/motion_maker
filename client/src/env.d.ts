// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
