// LegendUtils.tsx

// Function to convert rgba to hex, this will be used in the legend item creation
export function rgbaToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Function to generate the legend items, including the "No data" item
export function generateLegendItems(legendData: any[]): any[] {
    let legendItems = legendData.map(item => {
        const rgba = item.color.match(/\d+/g).map(Number);
        const [r, g, b] = rgba;
        const hexColor = rgbaToHex(r, g, b);

        return {
            columns: [
                {
                    canvas: [{
                        type: 'rect',
                        x: 0, y: 0,
                        w: 40 * 2,
                        h: 20 * 2,
                        color: hexColor
                    }],
                    width: 80,
                    height: 40,
                    margin: [0, 5, 10, 5]
                },
                {
                    text: item.label,
                    fontSize: 14 * 1.5,
                    alignment: 'left',
                    margin: [0, 11, 0, 0]
                }
            ],
            columnGap: 10
        };
    });

    // Add "No data" item
    const noDataLegendItem = {
        columns: [
            {
                canvas: [{
                    type: 'rect',
                    x: 0, y: 0,
                    w: 80,
                    h: 40,
                    color: '#a1a1a1'
                }],
                width: 80,
                height: 40,
                margin: [0, 5, 10, 5]
            },
            {
                text: 'No data',
                fontSize: 21,
                alignment: 'left',
                margin: [0, 11, 0, 0]
            }
        ],
        columnGap: 10
    };

    legendItems.push(noDataLegendItem);
    return legendItems;
}
