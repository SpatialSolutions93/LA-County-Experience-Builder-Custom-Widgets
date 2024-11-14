// Function to convert rgba to hex, this will be used in the legend item creation
export function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => ("0" + c.toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Function to generate the legend items, including the "No data" item
export function generateLegendItems(
  legendData: any[],
  globalSymbol: string
): any[] {
  let legendItems = legendData.map((item) => {
    // If item has item.color, use it as fill color, if it has item.fillColor, use it as fill color, if neither, use transparent
    if (!item.color && !item.fillColor) {
      item.color = "rgba(0, 0, 0, 0)";
    }
    if (item.color && !item.fillColor) {
      item.fillColor = item.color;
    }
    if (!item.color && item.fillColor) {
      item.color = item.fillColor;
    }
    // Determine the fill color
    let fillColor = item.color ? item.color : "rgba(0, 0, 0, 0)";

    // Extract RGBA values for fill color
    let fillRGBA = fillColor.match(/\d+/g).map(Number);

    const [r2, g2, b2] = fillRGBA;
    const fillHexColor = rgbaToHex(r2, g2, b2);

    // Determine the outline color and width
    let outlineColor = item.outlineColor || "rgba(0, 0, 0, 0)";

    const outlineWidth = item.outlineWidth || 0; // Default to 0 if no width provided

    // Extract RGBA values for outline color
    let outlineRGBA = outlineColor.match(/\d+/g).map(Number);

    const [r3, g3, b3] = outlineRGBA;
    const outlineHexColor = rgbaToHex(r3, g3, b3);

    // Adjust the position and size of the inner rectangle to accommodate the outline width
    const innerRectSize = { w: 30 * 2, h: 15 * 2 };
    const outerRectSize = {
      w: innerRectSize.w + outlineWidth * 2,
      h: innerRectSize.h + outlineWidth * 2,
    };

    return {
      columns: [
        {
          // Canvas with two rectangles to simulate fill and outline
          canvas: [
            // Outer rectangle for the outline
            {
              type: "rect",
              x: 0,
              y: 0,
              w: outerRectSize.w,
              h: outerRectSize.h,
              color: outlineHexColor,
            },
            // Inner rectangle for the fill
            {
              type: "rect",
              x: outlineWidth,
              y: outlineWidth,
              w: innerRectSize.w,
              h: innerRectSize.h,
              color: fillHexColor,
            },
          ],
          width: outerRectSize.w,
          height: outerRectSize.h,
          margin: [0, 5, 10, 5],
        },
        {
          text: item.label,
          fontSize: 14 * 1.5,
          alignment: "left",
          margin: [0, 11, 0, 0],
        },
      ],
      columnGap: 10,
    };
  });

  if (globalSymbol === "class-breaks") {
    const noDataLegendItem = {
      columns: [
        {
          canvas: [
            {
              type: "rect",
              x: 0,
              y: 0,
              w: 60,
              h: 30,
              color: "#a1a1a1",
            },
          ],
          width: 60,
          height: 30,
          margin: [0, 5, 10, 5],
        },
        {
          text: "No data",
          fontSize: 21,
          alignment: "left",
          margin: [0, 11, 0, 0],
        },
      ],
      columnGap: 10,
    };

    legendItems.push(noDataLegendItem);
  }
  return legendItems;
}
