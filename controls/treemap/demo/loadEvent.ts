import { TreeMap } from '../src/treemap/treemap';
import { TreeMapHighlight, TreeMapSelection } from '../src/treemap/user-interaction/highlight-selection';
import { TreeMapTooltip } from '../src/treemap/user-interaction/tooltip';
import { TreeMapLegend } from '../src/treemap/layout/legend';
import { DrillDown } from '../demo/Data/Drilldown_Sample';
import { ILoadEventArgs } from '../src/treemap/model/interface';
TreeMap.Inject(TreeMapTooltip, TreeMapHighlight, TreeMapSelection, TreeMapLegend);

/**
 * Default sample
 */
let prevTime: Date; let curTime: Date;
let treemap: TreeMap = new TreeMap({
    palette: ['#9999ff', '#CCFF99', '#FFFF99', '#FF9999', '#FF99FF', '#FFCC66'],
    titleSettings: {
        text: 'List of countries by population',
        textStyle: { size: '15px' }
    },
    enableDrillDown: true,
    format: 'n',
    initialDrillDown: {
        groupIndex: 1,
        groupName: 'Eastern Africa'
    },
    useGroupingSeparator: true,
    dataSource: DrillDown,
    weightValuePath: 'Population',
    leafItemSettings: {
        labelPath: 'Name',
        showLabels: false,
        labelStyle: { size: '0px' },
        border: { color: 'black', width: 0.5 }
    },
    levels: [
        { groupPath: 'Continent', fill: '#336699', border: { color: 'black', width: 0.5 } },
        { groupPath: 'States', fill: '#336699', border: { color: 'black', width: 0.5 } },
        { groupPath: 'Region', showHeader: false, fill: '#336699', border: { color: 'black', width: 0.5 } },
    ],
    load: (args: ILoadEventArgs)=> {
        args.treemap.titleSettings.text = "Title Changed in Load Event"
    }
});
treemap.appendTo('#container');


