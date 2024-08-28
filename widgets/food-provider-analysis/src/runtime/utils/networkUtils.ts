import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Sketch from "@arcgis/core/widgets/Sketch";
import { JimuMapView } from "jimu-arcgis";

export const handleNetworkPoint = (
  jimuMapView: JimuMapView,
  setNetworkPoint,
  setLastNetworkPoint,
  createServiceArea
) => {
  if (!jimuMapView || !jimuMapView.view) return;

  removeNetworkPoint(jimuMapView, setNetworkPoint);

  const newNetworkLayer = new GraphicsLayer({
    title: "Network Start Point",
  });
  jimuMapView.view.map.add(newNetworkLayer);

  setupNetworkPoint(
    newNetworkLayer,
    jimuMapView.view,
    setNetworkPoint,
    setLastNetworkPoint,
    createServiceArea
  );
};

export const setupNetworkPoint = (
  layer,
  view,
  setNetworkPoint,
  setLastNetworkPoint,
  createServiceArea
) => {
  const sketch = new Sketch({
    layer: layer,
    view: view,
    availableCreateTools: ["point"],
  });

  sketch.on("create", (event) => {
    if (event.state === "start") {
      layer.removeAll();
    } else if (event.state === "complete") {
      layer.add(event.graphic);
      setLastNetworkPoint(event.graphic.geometry);
      createServiceArea(event.graphic.geometry, view);
    }
  });

  view.ui.add(sketch, "bottom-right");
  setNetworkPoint(sketch);
};

export const removeNetworkPoint = (
  jimuMapView: JimuMapView,
  setNetworkPoint
) => {
  if (!jimuMapView || !jimuMapView.view) return;

  if (jimuMapView.view.ui.components.includes("networkPoint")) {
    jimuMapView.view.ui.remove("networkPoint");
    setNetworkPoint(null);
  }

  jimuMapView.view.graphics.removeAll();
};
