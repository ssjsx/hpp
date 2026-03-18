declare module "app1/App1Remote" {
  import type { ComponentType } from "react";

  const RemoteApp1: ComponentType;
  export default RemoteApp1;
}

declare module "app2/App2Remote" {
  import type { ComponentType } from "react";

  const RemoteApp2: ComponentType;
  export default RemoteApp2;
}
