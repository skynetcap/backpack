import ReactReconciler, { HostConfig, OpaqueHandle } from "react-reconciler";
import { EventEmitter } from "eventemitter3";
import {
  getLogger,
  Event,
  RpcRequest,
  CHANNEL_PLUGIN_REACT_RECONCILER_BRIDGE,
  RECONCILER_BRIDGE_METHOD_COMMIT_UPDATE,
  RECONCILER_BRIDGE_METHOD_COMMIT_TEXT_UPDATE,
  RECONCILER_BRIDGE_METHOD_APPEND_CHILD_TO_CONTAINER,
  RECONCILER_BRIDGE_METHOD_APPEND_CHILD,
  RECONCILER_BRIDGE_METHOD_INSERT_IN_CONTAINER_BEFORE,
  RECONCILER_BRIDGE_METHOD_INSERT_BEFORE,
  RECONCILER_BRIDGE_METHOD_REMOVE_CHILD,
  RECONCILER_BRIDGE_METHOD_REMOVE_CHILD_FROM_CONTAINER,
} from "@coral-xyz/common-public";
import { NAV_STACK } from "./Context";

const logger = getLogger("react-xnft/reconciler");
const events = new EventEmitter();

export const ReactXnft = {
  events,
  render(reactNode: any) {
    window.onload = () => {
      window.xnft.on("click", (event: Event) => {
        logger.debug("on click event", event);
        const { viewId } = event.data;
        const handler = getClickHandler(viewId);
        handler();
      });

      window.xnft.on("change", (event: Event) => {
        logger.debug("on change event", event);
        const { viewId } = event.data;
        const handler = getOnChangeHandler(viewId);
        handler(event);
      });

      window.xnft.on("connect", () => {
        logger.debug("connect");
        NAV_STACK.push(reactNode);
        events.emit("connect");
      });

      window.xnft.on("mount", () => {
        logger.debug("mount");
        const node = NAV_STACK[NAV_STACK.length - 1];
        reconcilerRender(node);
      });

      window.xnft.on("unmount", () => {
        logger.debug("unmount");
        CLICK_HANDLERS = new Map();
        ON_CHANGE_HANDLERS = new Map();
      });

      window.xnft.on("pop", () => {
        logger.debug("pop");
        NAV_STACK.pop();
      });
    };
  },
  renderWidget(reactNode: any) {},
};

//
// Renders the dom in the hosted environment.
//
export function reconcilerRender(reactNode: any) {
  const cb = () => {};
  const root: RootContainer = {
    host: HOST,
    children: [],
  };
  const container = RECONCILER.createContainer(root, false, false);
  RECONCILER.updateContainer(reactNode, container, null, cb);
}

const RECONCILER = ReactReconciler({
  isPrimaryRenderer: true,
  supportsMutation: true,
  supportsHydration: false,
  supportsPersistence: false,

  now: Date.now,
  noTimeout: -1,

  //
  // Host context configuration.
  //
  getRootHostContext: (root: RootContainer): Host => {
    logger.debug("getRootHostContext");
    return root.host;
  },
  getChildHostContext: (
    parentHost: Host,
    kind: NodeKind,
    root: RootContainer
  ): Host => {
    logger.debug("getChildHostContext");
    return parentHost;
  },

  //
  // Create serialized nodes.
  //
  createInstance: (
    kind: NodeKind,
    props: NodeProps,
    r: RootContainer,
    h: Host,
    o: OpaqueHandle
  ): NodeSerialized => {
    logger.debug("createInstance", kind, props);
    switch (kind) {
      case NodeKind.View:
        return createViewInstance(kind, props, r, h, o);
      case NodeKind.Table:
        return createTableInstance(kind, props, r, h, o);
      case NodeKind.TableRow:
        return createTableRowInstance(kind, props, r, h, o);
      case NodeKind.Text:
        return createTextLabelInstance(kind, props, r, h, o);
      case NodeKind.TextField:
        return createTextFieldInstance(kind, props, r, h, o);
      case NodeKind.Image:
        return createImageInstance(kind, props, r, h, o);
      case NodeKind.Button:
        return createButtonInstance(kind, props, r, h, o);
      case NodeKind.Loading:
        return createLoadingInstance(kind, props, r, h, o);
      case NodeKind.ScrollBar:
        return createScrollBarInstance(kind, props, r, h, o);
      case NodeKind.Svg:
        return createSvgInstance(kind, props, r, h, o);
      case NodeKind.Path:
        return createPathInstance(kind, props, r, h, o);
      case NodeKind.Circle:
        return createCircleInstance(kind, props, r, h, o);
      case NodeKind.Iframe:
        return createIframeInstance(kind, props, r, h, o);
      case NodeKind.NavAnimation:
        return createNavAnimationInstance(kind, props, r, h, o);
      case NodeKind.BalancesTable:
        return createBalancesTableInstance(kind, props, r, h, o);
      case NodeKind.BalancesTableHead:
        return createBalancesTableHeadInstance(kind, props, r, h, o);
      case NodeKind.BalancesTableContent:
        return createBalancesTableContentInstance(kind, props, r, h, o);
      case NodeKind.BalancesTableRow:
        return createBalancesTableRowInstance(kind, props, r, h, o);
      case NodeKind.BalancesTableCell:
        return createBalancesTableCellInstance(kind, props, r, h, o);
      case NodeKind.BalancesTableFooter:
        return createBalancesTableFooterInstance(kind, props, r, h, o);
      default:
        logger.error("unexpected node kind", kind);
        throw new Error("unexpected node kind");
    }
  },
  createTextInstance: (
    text: string,
    _r: RootContainer,
    h: Host,
    _o: OpaqueHandle
  ): TextSerialized => {
    logger.debug("createTextInstance", text);
    const instance = {
      id: h.nextId(),
      kind: "raw" as const,
      text,
      props: undefined,
      style: undefined,
    };
    return instance;
  },
  appendInitialChild: (parent: NodeSerialized, child: Element) => {
    logger.debug("appendInitialChild", parent, child);
    parent.children.push(child);
  },

  //
  // Render phase.
  //
  prepareUpdate: (
    instance: NodeSerialized,
    type: NodeKind,
    oldProps: NodeProps,
    newProps: NodeProps,
    root: RootContainer,
    host: Host
  ): UpdateDiff => {
    logger.debug("prepareUpdate", instance, type, oldProps, newProps);
    let payload: UpdateDiff = {};
    switch (type) {
      case NodeKind.View:
        // @ts-ignore
        if (oldProps.style !== newProps.style) {
          // @ts-ignore
          payload = { ...payload, style: newProps.style };
        }
        // @ts-ignore
        if (oldProps.onClick !== newProps.onClick) {
          // @ts-ignore
          payload = { ...payload, onClick: newProps.onClick };
        }
        return payload;
      case NodeKind.Text:
        // @ts-ignore
        if (oldProps.style !== newProps.style) {
          payload = {
            ...payload,
            // @ts-ignore
            style: newProps.style,
          };
        }
        return payload;
      case NodeKind.TextField:
        // @ts-ignore
        if (oldProps.value !== newProps.value) {
          // @ts-ignore
          payload = { ...payload, value: newProps.value };
        }
        return payload;
      case NodeKind.NavAnimation:
        // @ts-ignore
        if (oldProps.routeName !== newProps.routeName) {
          // @ts-ignore
          payload = { ...payload, routeName: newProps.routeName };
        }
        return payload;
      case NodeKind.Path:
        // @ts-ignore
        if (oldProps.fill !== newProps.fill) {
          // @ts-ignore
          payload = { ...payload, fill: newProps.fill };
        }
        return payload;
      case NodeKind.Button:
        // @ts-ignore
        if (oldProps.style !== newProps.style) {
          // @ts-ignore
          payload = { ...payload, style: newProps.style };
        }
        // @ts-ignore
        if (oldProps.onClick !== newProps.onClick) {
          // @ts-ignore
          payload = { ...payload, onClick: newProps.onClick };
        }
        return payload;
      case NodeKind.Image:
        // @ts-ignore
        if (oldProps.style !== newProps.style) {
          // @ts-ignore
          payload = { ...payload, style: newProps.style };
        }
        // @ts-ignore
        if (oldProps.onClick !== newProps.onClick) {
          // @ts-ignore
          payload = { ...payload, onClick: newProps.onClick };
        }
        // @ts-ignore
        if (oldProps.src !== newProps.src) {
          // @ts-ignore
          payload = { ...payload, src: newProps.src };
        }
        return payload;
      case NodeKind.Iframe:
        return null;
      case NodeKind.Svg:
        return null;
      case NodeKind.Circle:
        return null;
      case NodeKind.Table:
        return null;
      case NodeKind.TableRow:
        return null;
      case NodeKind.Loading:
        return null;
      case NodeKind.ScrollBar:
        return null;
      case NodeKind.BalancesTable:
        return null;
      case NodeKind.BalancesTableHead:
        return null;
      case NodeKind.BalancesTableContent:
        return null;
      case NodeKind.BalancesTableRow:
        return null;
      case NodeKind.BalancesTableCell:
        return null;
      case NodeKind.BalancesTableFooter:
        return null;
      default:
        throw new Error("unexpected node kind");
    }
  },
  finalizeInitialChildren: (
    _parent: NodeSerialized,
    _kind: NodeKind,
    _props: NodeProps,
    _root: RootContainer,
    _host: Host
  ): boolean => {
    logger.debug(
      "finalizeInitialChildren",
      _parent,
      _kind,
      _props,
      _root,
      _host
    );
    return false;
  },

  //
  // Commit phase.
  //
  prepareForCommit: (_c: RootContainer) => {
    logger.debug("prepareForCommit", _c);
    return null;
  },
  commitUpdate: (
    instance: NodeSerialized,
    updatePayload: UpdateDiff,
    type: NodeKind,
    oldProps: NodeProps,
    newProps: NodeProps,
    internalInstanceHandle: OpaqueHandle
  ) => {
    logger.debug(
      "commitUpdate",
      instance,
      type,
      updatePayload,
      oldProps,
      newProps
    );

    //
    // If there's no update payload, then don't rerender!
    //
    if (updatePayload === null || Object.keys(updatePayload).length === 0) {
      return;
    }

    switch (type) {
      case NodeKind.View:
        if (updatePayload.style) {
          instance.style = updatePayload.style;
        }
        if (
          updatePayload.onClick !== undefined &&
          updatePayload.onClick !== null
        ) {
          // @ts-ignore
          instance.props.onClick = updatePayload.onClick;
          // @ts-ignore
          CLICK_HANDLERS.set(instance.id, instance.props.onClick);
          delete updatePayload["onClick"];
        }
        break;
      case NodeKind.Text:
        if (updatePayload.style !== undefined && updatePayload.style !== null) {
          instance.style = updatePayload.style;
        }
        break;
      case NodeKind.TextField:
        if (updatePayload.value !== undefined && updatePayload.value !== null) {
          // @ts-ignore
          instance.props.value = updatePayload.value;
        }
        break;
      case NodeKind.NavAnimation:
        if (
          updatePayload.routeName !== undefined &&
          updatePayload.routeName !== null
        ) {
          // @ts-ignore
          instance.props.routeName = updatePayload.routeName;
        }
        break;
      case NodeKind.Path:
        if (updatePayload.fill !== undefined && updatePayload.fill !== null) {
          // @ts-ignore
          instance.props.fill = updatePayload.fill;
        }
        break;
      case NodeKind.Button:
        if (updatePayload.style !== undefined && updatePayload.style !== null) {
          instance.style = updatePayload.style;
        }
        if (
          updatePayload.onClick !== undefined &&
          updatePayload.onClick !== null
        ) {
          // @ts-ignore
          instance.props.onClick = updatePayload.onClick;
          // @ts-ignore
          CLICK_HANDLERS.set(instance.id, instance.props.onClick);
          delete updatePayload["onClick"];
        }
        break;
      case NodeKind.Image:
        if (updatePayload.style) {
          instance.style = updatePayload.style;
        }
        if (updatePayload.src) {
          // @ts-ignore
          instance.props.src = updatePayload.src;
        }
        if (
          updatePayload.onClick !== undefined &&
          updatePayload.onClick !== null
        ) {
          // @ts-ignore
          instance.props.onClick = updatePayload.onClick;
          // @ts-ignore
          CLICK_HANDLERS.set(instance.id, instance.props.onClick);
          delete updatePayload["onClick"];
        }
        break;
      case NodeKind.Text:
        throw new Error("commitUpdate Text not yet implemented");
      case NodeKind.Svg:
        throw new Error("commitUpdate Svg not yet implemented");
      case NodeKind.Circle:
        throw new Error("commitUpdate Circle not yet implemented");
      case NodeKind.ScrollBar:
        throw new Error("commitUpdate ScrollBar not yet implemented");
      case NodeKind.Loading:
        throw new Error("commitUpdate Loading not yet implemented");
      default:
        throw new Error("unexpected node kind");
    }

    ReconcilerBridgeManager.bridge({
      method: RECONCILER_BRIDGE_METHOD_COMMIT_UPDATE,
      params: [instance.id, updatePayload],
    });
  },
  commitTextUpdate: (
    textInstance: TextSerialized,
    oldText: string,
    nextText: string
  ) => {
    logger.debug("commitTextUpdate");
    textInstance.text = nextText;

    ReconcilerBridgeManager.bridge({
      method: RECONCILER_BRIDGE_METHOD_COMMIT_TEXT_UPDATE,
      params: [textInstance.id, nextText],
    });
  },
  appendChildToContainer: (c: RootContainer, child: Element) => {
    logger.debug("appendChildToContainer", c, child);
    c.children.push(child);

    ReconcilerBridgeManager.bridge({
      method: RECONCILER_BRIDGE_METHOD_APPEND_CHILD_TO_CONTAINER,
      params: [child],
    });
  },
  appendChild: (parent: NodeSerialized, child: Element) => {
    logger.debug("appendChild", parent, child);
    parent.children.push(child);

    ReconcilerBridgeManager.bridge({
      method: RECONCILER_BRIDGE_METHOD_APPEND_CHILD,
      params: [parent.id, child],
    });
  },
  insertInContainerBefore: (
    root: RootContainer,
    child: Element,
    before: Element
  ) => {
    logger.debug("insertInContainerBefore");

    const newChildren = root.children.filter((c: Element) => c.id !== child.id);

    const idx = root.children.indexOf(before);
    if (idx === -1) {
      throw new Error("child not found");
    }

    root.children = newChildren
      .slice(0, idx)
      .concat([child])
      .concat(root.children.slice(idx));

    ReconcilerBridgeManager.bridge({
      method: RECONCILER_BRIDGE_METHOD_INSERT_IN_CONTAINER_BEFORE,
      params: [child, before.id],
    });
  },
  insertBefore: (parent: NodeSerialized, child: Element, before: Element) => {
    logger.debug("insertBefore");
    const newChildren = parent.children.filter(
      (c: Element) => c.id !== child.id
    );

    const idx = parent.children.indexOf(before);
    if (idx === -1) {
      throw new Error("child not found");
    }

    parent.children = newChildren
      .slice(0, idx)
      .concat([child])
      .concat(parent.children.slice(idx));

    ReconcilerBridgeManager.bridge({
      method: RECONCILER_BRIDGE_METHOD_INSERT_BEFORE,
      params: [parent.id, child, before.id],
    });
  },
  removeChild: (parent: NodeSerialized, child: Element) => {
    logger.debug("removeChild", parent, child);

    parent.children = parent.children.filter((c) => c !== child);
    deleteClickHandlers(child);
    deleteOnChangeHandlers(child);

    ReconcilerBridgeManager.bridge({
      method: RECONCILER_BRIDGE_METHOD_REMOVE_CHILD,
      params: [parent.id, child.id],
    });
  },
  removeChildFromContainer: (root: RootContainer, child: Element) => {
    logger.debug("removeChildFromContainer", root, child);

    root.children = root.children.filter((c) => c !== child);
    deleteClickHandlers(child);
    deleteOnChangeHandlers(child);

    ReconcilerBridgeManager.bridge({
      method: RECONCILER_BRIDGE_METHOD_REMOVE_CHILD_FROM_CONTAINER,
      params: [child.id],
    });
  },

  //
  // Misc.
  //
  getPublicInstance: (instance: Element) => {
    logger.debug("getPublicInstance");
    return instance;
  },
  shouldSetTextContent: () => {
    logger.debug("shouldSetTextContent");
    return false;
  },
  resetAfterCommit: (root: RootContainer) => {
    logger.debug("resetAfterCommit", root);
  },
  clearContainer: (root: RootContainer) => {
    logger.debug("clearContainer", root);
    root.children = [];
  },
  shouldDeleteUnhydratedTailInstances: () => {
    logger.debug("shouldDeleteUnhydratedTailInstances");
  },
  scheduleTimeout: (fn: () => void, delay: number) => {
    logger.debug("scheduleTimeout");
    return setTimeout(fn, delay);
  },
});

function createViewInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): ViewNodeSerialized {
  const id = h.nextId();
  let onClick = false;
  const vProps = props as ViewProps;
  if (vProps.onClick && typeof vProps.onClick === "function") {
    CLICK_HANDLERS.set(id, vProps.onClick);
    onClick = true;
  }
  return {
    id,
    kind: NodeKind.View,
    props: {
      ...props,
      onClick,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createTableInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): TableNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.Table,
    props: {
      ...props,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createTableRowInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): TableRowNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.TableRow,
    props: {
      ...props,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createTextLabelInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): TextNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.Text,
    props: {
      ...props,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createTextFieldInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): TextFieldNodeSerialized {
  const id = h.nextId();
  let onChange = false;
  const tfProps = props as TextFieldProps;
  if (tfProps.onChange && typeof tfProps.onChange === "function") {
    ON_CHANGE_HANDLERS.set(id, tfProps.onChange);
    onChange = true;
  }
  return {
    id,
    kind: NodeKind.TextField,
    props: {
      ...props,
      onChange,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createImageInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): ImageNodeSerialized {
  const id = h.nextId();
  let onClick = false;
  const vProps = props as ImageProps;
  if (vProps.onClick && typeof vProps.onClick === "function") {
    CLICK_HANDLERS.set(id, vProps.onClick);
    onClick = true;
  }
  const src = (props as ImageProps).src;
  return {
    id,
    kind: NodeKind.Image,
    props: {
      ...props,
      src,
      onClick,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createButtonInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): ButtonNodeSerialized {
  const id = h.nextId();
  let onClick = false;
  const vProps = props as ButtonProps;
  if (vProps.onClick && typeof vProps.onClick === "function") {
    CLICK_HANDLERS.set(id, vProps.onClick);
    onClick = true;
  }
  return {
    id,
    kind: NodeKind.Button,
    props: {
      ...props,
      onClick,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createLoadingInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): LoadingNodeSerialized {
  const id = h.nextId();
  return {
    id,
    kind: NodeKind.Loading,
    // @ts-ignore
    props,
    style: props.style || {},
    children: [],
  };
}

function createScrollBarInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): ScrollBarNodeSerialized {
  const id = h.nextId();
  return {
    id,
    kind: NodeKind.ScrollBar,
    props: {
      ...props,
      children: undefined,
    },
    style: {},
    children: [],
  };
}

function createSvgInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): SvgNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.Svg,
    // @ts-ignore
    props: {
      ...props,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createPathInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): PathNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.Path,
    // @ts-ignore
    props: {
      ...props,
    },
    style: props.style || {},
    children: [],
  };
}

function createCircleInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): CircleNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.Circle,
    // @ts-ignore
    props: {
      ...props,
    },
    style: props.style || {},
    children: [],
  };
}

function createIframeInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): IframeNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.Iframe,
    // @ts-ignore
    props: {
      ...props,
    },
    style: props.style || {},
    children: [],
  };
}

function createNavAnimationInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): NavAnimationNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.NavAnimation,
    // @ts-ignore
    props: {
      ...props,
      children: undefined,
    },
    style: {},
    children: [],
  };
}

function createBalancesTableInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): BalancesTableNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.BalancesTable,
    props: {
      ...props,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createBalancesTableHeadInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): BalancesTableHeadNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.BalancesTableHead,
    // @ts-ignore
    props: {
      ...props,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createBalancesTableContentInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): BalancesTableContentNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.BalancesTableContent,
    props: {
      ...props,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createBalancesTableRowInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): BalancesTableRowNodeSerialized {
  const id = h.nextId();
  let onClick = false;
  const vProps = props as BalancesTableRowProps;
  if (vProps.onClick && typeof vProps.onClick === "function") {
    CLICK_HANDLERS.set(id, vProps.onClick);
    onClick = true;
  }
  return {
    id,
    kind: NodeKind.BalancesTableRow,
    props: {
      ...props,
      onClick,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createBalancesTableCellInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): BalancesTableCellNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.BalancesTableCell,
    props: {
      ...props,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

function createBalancesTableFooterInstance(
  _kind: NodeKind,
  props: NodeProps,
  _r: RootContainer,
  h: Host,
  _o: OpaqueHandle
): BalancesTableFooterNodeSerialized {
  return {
    id: h.nextId(),
    kind: NodeKind.BalancesTableFooter,
    props: {
      ...props,
      children: undefined,
    },
    style: props.style || {},
    children: [],
  };
}

export type RootContainer = {
  host: Host;
  children: Element[];
};

export type Host = {
  nextId: () => number;
};

export const HOST: Host = {
  nextId: (() => {
    let id = 0;
    return () => id++;
  })(),
};

type _HostConfig = HostConfig<
  NodeKind,
  NodeProps,
  RootContainer,
  NodeSerialized,
  TextSerialized,
  HydratableInstance,
  Element,
  Host,
  UpdateDiff,
  ChildSet,
  TimeoutHandle,
  NoTimeout
>;

type Style = any;

//
// All node types.
//
export type NodeSerialized =
  | TableNodeSerialized
  | TableRowNodeSerialized
  | TextNodeSerialized
  | TextFieldNodeSerialized
  | ImageNodeSerialized
  | ViewNodeSerialized
  | ButtonNodeSerialized
  | LoadingNodeSerialized
  | ScrollBarNodeSerialized
  | SvgNodeSerialized
  | PathNodeSerialized
  | CircleNodeSerialized
  | IframeNodeSerialized
  | NavAnimationNodeSerialized
  | BalancesTableNodeSerialized
  | BalancesTableHeadNodeSerialized
  | BalancesTableContentNodeSerialized
  | BalancesTableRowNodeSerialized
  | BalancesTableCellNodeSerialized
  | BalancesTableFooterNodeSerialized;
type NodeProps =
  | TableProps
  | TableRowProps
  | TextProps
  | TextFieldProps
  | ImageProps
  | ViewProps
  | ButtonProps
  | LoadingProps
  | ScrollBarProps
  | IframeProps
  // TODO: add these and fix the types.
  //	| SvgProps
  //	| PathProps
  //	| CircleProps
  | NavAnimationProps
  | BalancesTableProps
  | BalancesTableHeadProps
  | BalancesTableContentProps
  | BalancesTableRowProps
  | BalancesTableCellProps
  | BalancesTableFooterProps;
export enum NodeKind {
  //
  // App.
  //
  Table = "Table",
  TableRow = "TableRow",
  Text = "Text",
  TextField = "TextField",
  Image = "Image",
  View = "View",
  Button = "Button",
  Loading = "Loading",
  ScrollBar = "ScrollBar",
  Svg = "Svg",
  Path = "Path",
  Circle = "Circle",
  Iframe = "Iframe",
  NavAnimation = "NavAnimation",

  //
  // Widget.
  //
  BalancesTable = "BalancesTable",
  BalancesTableHead = "BalancesTableHead",
  BalancesTableContent = "BalancesTableContent",
  BalancesTableRow = "BalancesTableRow",
  BalancesTableCell = "BalancesTableCell",
  BalancesTableFooter = "BalancesTableFooter",
}

//
// Table.
//
type TableNodeSerialized = DefNodeSerialized<NodeKind.Table, TableProps>;
type TableProps = {
  style: Style;
  children: undefined;
};

//
// TableRow.
//
type TableRowNodeSerialized = DefNodeSerialized<
  NodeKind.TableRow,
  TableRowProps
>;
type TableRowProps = {
  style: Style;
  children: undefined;
};

//
// Text.
//
type TextNodeSerialized = DefNodeSerialized<NodeKind.Text, TextProps>;
type TextProps = {
  style: Style;
  children: undefined;
};

//
// TextField.
//
type TextFieldNodeSerialized = DefNodeSerialized<
  NodeKind.TextField,
  TextFieldProps
>;
type TextFieldProps = {
  onChange?: ((event: Event) => void) | boolean;
  value?: any;
  multiline?: boolean;
  numberOfLines?: number;
  placeholder?: string;
  style: Style;
  children: undefined;
};

//
// Image.
//
type ImageNodeSerialized = DefNodeSerialized<NodeKind.Image, ImageProps>;
type ImageProps = {
  style: Style;
  onClick?: (() => Promise<void>) | boolean;
  children: undefined;
  src: string;
};

//
// View.
//
type ViewNodeSerialized = DefNodeSerialized<NodeKind.View, ViewProps>;
type ViewProps = {
  onClick?: (() => Promise<void>) | boolean;
  style: Style;
  children: undefined;
};

//
// Button.
//
type ButtonNodeSerialized = DefNodeSerialized<NodeKind.Button, ButtonProps>;
type ButtonProps = {
  onClick?: (() => Promise<void>) | boolean;
  style: Style;
  children: undefined;
};

//
// Loading.
//
type LoadingNodeSerialized = DefNodeSerialized<NodeKind.Loading, LoadingProps>;
type LoadingProps = {
  style: Style;
  children: undefined;
};

//
// ScrollBar.
//
type ScrollBarNodeSerialized = DefNodeSerialized<
  NodeKind.ScrollBar,
  ScrollBarProps
>;
type ScrollBarProps = {
  style: Style;
  children: undefined;
};

//
// Svg.
//
type SvgNodeSerialized = DefNodeSerialized<NodeKind.Svg, SvgProps>;
type SvgProps = {
  width: string;
  height: string;
  viewBox: string;
  fill: string;
  children: undefined;
  style: Style;
};

//
// Path.
//
type PathNodeSerialized = DefNodeSerialized<NodeKind.Path, PathProps>;
type PathProps = {
  d: string;
  fill: string;
  fillRule?: string;
  clipRule?: string;
  stroke?: string;
};

type CircleNodeSerialized = DefNodeSerialized<NodeKind.Circle, CircleProps>;
type CircleProps = {
  cx: string;
  cy: string;
  r: string;
  fill: string;
  stroke: string;
  strokeWidth: string;
  pathLength: string;
  strokeDasharray: string;
  strokeDashoffset: string;
};

//
// IFrame.
//
type IframeNodeSerialized = DefNodeSerialized<NodeKind.Iframe, IframeProps>;
type IframeProps = {
  style: Style;
  children: undefined;
  width: string;
  height: string;
  xnft: boolean;
};

//
// NavAnimation.
//
type NavAnimationNodeSerialized = DefNodeSerialized<
  NodeKind.NavAnimation,
  NavAnimationProps
>;
type NavAnimationProps = {
  routeName: string;
  navAction: string;
  style: undefined;
  children: undefined;
};

//
// Raw Text.
//
export type TextSerialized = {
  id: number;
  kind: "raw";
  text: string | number;
  props: undefined;
  style: undefined;
};

//
// BalancesTable.
//
type BalancesTableNodeSerialized = DefNodeSerialized<
  NodeKind.BalancesTable,
  BalancesTableProps
>;
type BalancesTableProps = {
  style: Style;
  children: undefined;
};
type BalancesTableHeadNodeSerialized = DefNodeSerialized<
  NodeKind.BalancesTableHead,
  BalancesTableHeadProps
>;
type BalancesTableHeadProps = {
  style: Style;
  title: string;
  iconUrl: string;
  children: undefined;
};
type BalancesTableContentNodeSerialized = DefNodeSerialized<
  NodeKind.BalancesTableContent,
  BalancesTableContentProps
>;
type BalancesTableContentProps = {
  style: Style;
  children: undefined;
};
type BalancesTableRowNodeSerialized = DefNodeSerialized<
  NodeKind.BalancesTableRow,
  BalancesTableRowProps
>;
type BalancesTableRowProps = {
  onClick?: (() => Promise<void>) | boolean;
  style: Style;
  children: undefined;
};
type BalancesTableCellNodeSerialized = DefNodeSerialized<
  NodeKind.BalancesTableCell,
  BalancesTableCellProps
>;
type BalancesTableCellProps = {
  icon?: string;
  title?: string;
  subtitle?: string;
  usdValue?: number;
  percentChange?: number;
  style: Style;
  children: undefined;
};
type BalancesTableFooterNodeSerialized = DefNodeSerialized<
  NodeKind.BalancesTableFooter,
  BalancesTableFooterProps
>;
type BalancesTableFooterProps = {
  style: Style;
  children: undefined;
};

//
// Any element that can be placed in the Anchor App DOM.
//
export type Element = NodeSerialized | TextSerialized;

export type ElementPointer = {
  id: number;
  children?: Array<ElementPointer>;
};

type DefNodeSerialized<K, P> = {
  id: number;
  kind: K;
  props: P;
  style: Style;
  children: Array<Element>;
};

export type UpdateDiff = any;

type HydratableInstance = never;
type ChildSet = never;
type TimeoutHandle = number;
const noTimeout = -1;
type NoTimeout = typeof noTimeout;

let CLICK_HANDLERS = new Map<number, () => void>();
let ON_CHANGE_HANDLERS = new Map<number, (event: Event) => void>();

//
// Garbage collects all click handlers from the given element being removed
// from the DOM.
//
function deleteClickHandlers(element: Element) {
  CLICK_HANDLERS.delete(element.id);
  // @ts-ignore
  if (element.children) {
    // @ts-ignore
    element.children.forEach((c) => deleteClickHandlers(c));
  }
}

function deleteOnChangeHandlers(element: Element) {
  ON_CHANGE_HANDLERS.delete(element.id);
  // @ts-ignore
  if (element.children) {
    // @ts-ignore
    element.children.forEach((c) => deleteOnChangeHandlers(c));
  }
}

function getClickHandler(viewId: number): () => void {
  const handler = CLICK_HANDLERS.get(viewId);
  if (!handler) {
    throw new Error("click handler not found");
  }
  return handler;
}

function getOnChangeHandler(viewId: number): (event: any) => void {
  const handler = ON_CHANGE_HANDLERS.get(viewId);
  if (!handler) {
    throw new Error("change handler not found");
  }
  return handler;
}

export class ReconcilerBridgeManager {
  private static _renderId = 0;

  //
  // Send a message from the plugin-ui to the host over the reconciler bridge.
  //
  public static bridge(req: RpcRequest) {
    const msg = {
      type: CHANNEL_PLUGIN_REACT_RECONCILER_BRIDGE,
      href: window.location.href,
      detail: {
        renderId: ReconcilerBridgeManager._nextRenderId(),
        ...req,
      },
    };

    window.parent.postMessage(msg, "*");
  }

  private static _nextRenderId(): number {
    const id = ReconcilerBridgeManager._renderId;
    ReconcilerBridgeManager._renderId += 1;
    return id;
  }
}
