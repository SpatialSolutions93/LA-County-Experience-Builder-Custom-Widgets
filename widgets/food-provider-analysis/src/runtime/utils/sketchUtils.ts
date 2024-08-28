import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Sketch from "@arcgis/core/widgets/Sketch";
import { JimuMapView } from "jimu-arcgis";

export const handleSketchWidget = (
  jimuMapView: JimuMapView,
  setSketchWidget,
  setLastGraphicGeometry
) => {
  if (!jimuMapView || !jimuMapView.view) return;

  removeSketchWidget(jimuMapView, setSketchWidget);

  const newSketchLayer = new GraphicsLayer({
    title: "Custom Boundary",
  });
  jimuMapView.view.map.add(newSketchLayer);

  setupSketchWidget(
    newSketchLayer,
    jimuMapView.view,
    setSketchWidget,
    setLastGraphicGeometry
  );
};

export const setupSketchWidget = (
  layer,
  view,
  setSketchWidget,
  setLastGraphicGeometry
) => {
  const sketch = new Sketch({
    layer: layer,
    view: view,
    availableCreateTools: ["polygon", "rectangle"],
  });

  sketch.on("create", (event) => {
    if (event.state === "complete") {
      layer.removeAll();
      layer.add(event.graphic);
      setLastGraphicGeometry(event.graphic.geometry);
    }
  });

  view.ui.add(sketch, "bottom-right");
  setSketchWidget(sketch);
};

export const removeSketchWidget = (
  jimuMapView: JimuMapView,
  setSketchWidget
) => {
  if (!jimuMapView || !jimuMapView.view) return;

  if (jimuMapView.view.ui.components.includes("sketchWidget")) {
    jimuMapView.view.ui.remove("sketchWidget");
    setSketchWidget(null);
  }
};
