import { Maps } from '../../index';
import {
    LayerSettings, MarkerSettings, IMarkerRenderingEventArgs, markerRendering,
     convertTileLatLongToPoint, MapLocation, MarkerClusterData
} from '../index';
import { IMarkerClickEventArgs, markerClick, IMarkerMoveEventArgs, markerMouseMove,
    IMarkerClusterClickEventArgs, IMarkerClusterMoveEventArgs, markerClusterClick, markerClusterMouseMove,
    MarkerSettingsModel } from '../index';
import { isNullOrUndefined, createElement } from '@syncfusion/ej2-base';
import { Point, getTranslate, convertGeoToPoint, clusterTemplate, marker, markerTemplate, getZoomTranslate } from '../utils/helper';
import {
     getElementByID, mergeSeparateCluster, clusterSeparate
} from '../utils/helper';

/**
 * Marker class
 */
export class Marker {
    private maps: Maps;
    private isMarkerExplode: number;
    private trackElements: Element[];
    private markerSVGObject: Element;
    private previousExplodeId: string;
    /**
     * @private
     */
    public sameMarkerData: MarkerClusterData[];
    constructor(maps: Maps) {
        this.maps = maps;
        this.trackElements = [];
        this.sameMarkerData = [];
    }

    /* tslint:disable:no-string-literal */
    public markerRender(layerElement: Element, layerIndex: number, factor: number, type: string): void {
        let templateFn: Function;
        let markerCount: number = 0;
        let markerTemplateCount : number = 0;
        let currentLayer: LayerSettings = <LayerSettings>this.maps.layersCollection[layerIndex];
        this.markerSVGObject = this.maps.renderer.createGroup({
            id: this.maps.element.id + '_Markers_Group',
            style: 'pointer-events: auto;'
        });
        let markerTemplateEle: HTMLElement = createElement('div', {
            id: this.maps.element.id + '_LayerIndex_' + layerIndex + '_Markers_Template_Group',
            className: 'template',
            styles: 'overflow: hidden; position: absolute;pointer-events: none;' +
                'top:' + (this.maps.isTileMap ? 0 : this.maps.mapAreaRect.y) + 'px;' +
                'left:' + (this.maps.isTileMap ? 0 : this.maps.mapAreaRect.x) + 'px;' +
                'height:' + this.maps.mapAreaRect.height + 'px;' +
                'width:' + this.maps.mapAreaRect.width + 'px;'
        });
        //tslint:disable
        currentLayer.markerSettings.map((markerSettings: MarkerSettings, markerIndex: number) => {
            let markerData: Object[] = <Object[]>markerSettings.dataSource;
            markerData.forEach((data: Object, dataIndex: number) => {
                let eventArgs: IMarkerRenderingEventArgs = {
                    cancel: false, name: markerRendering, fill: markerSettings.fill, height: markerSettings.height,
                    width: markerSettings.width, imageUrl: markerSettings.imageUrl, shape: markerSettings.shape,
                    template: markerSettings.template, data: data, maps: this.maps, marker: markerSettings,
                    border: markerSettings.border
                };
                if (this.maps.isBlazor) {
                    const {maps, marker, ...blazorEventArgs} :  IMarkerRenderingEventArgs = eventArgs;
                    eventArgs = blazorEventArgs;
                }
                this.maps.trigger('markerRendering', eventArgs, (MarkerArgs: IMarkerRenderingEventArgs) => {
                    let lng: number = data['longitude'];
                    let lat: number = data['latitude'];
                    let data1: Object = {};
                    let text: string[] = [];
                    let j: number = 0;
                    for (let i: number = 0; i < Object.keys(data).length; i++) {
                        if(Object.keys(data)[i].toLowerCase() !== 'latitude' && Object.keys(data)[i].toLowerCase() !== 'longitude' && Object.keys(data)[i].toLowerCase() !== 'name'
                            && Object.keys(data)[i].toLowerCase() !== 'blazortemplateid' && Object.keys(data)[i].toLowerCase() !== 'text') {
                                text[j] = data[Object.keys(data)[i].toLowerCase()];
                                data1['text'] = text;
                                j++;
                        }
                    }
                    data['text'] = data1['text'];
                    let offset: Point = markerSettings.offset;
                    if (!eventArgs.cancel && markerSettings.visible && !isNullOrUndefined(lng) && !isNullOrUndefined(lat)) {
                        let markerID: string = this.maps.element.id + '_LayerIndex_' + layerIndex + '_MarkerIndex_'
                            + markerIndex + '_dataIndex_' + dataIndex;
                        let location: Point = (this.maps.isTileMap) ? convertTileLatLongToPoint(
                            new MapLocation(lng, lat), factor, this.maps.tileTranslatePoint, true
                        ) : convertGeoToPoint(lat, lng, factor, currentLayer, this.maps);
                        let animate: boolean = currentLayer.animationDuration !== 0 || isNullOrUndefined(this.maps.zoomModule);
                        let translate: Object = (this.maps.isTileMap) ? new Object() :
                            !isNullOrUndefined(this.maps.zoomModule) && this.maps.zoomSettings.zoomFactor > 1 ?
                                getZoomTranslate(this.maps, currentLayer, animate) :
                                getTranslate(this.maps, currentLayer, animate);
                        let scale: number = type === 'AddMarker' ? this.maps.scale : translate['scale'];
                        let transPoint: Point = type === 'AddMarker' ? this.maps.translatePoint : translate['location'] as Point;
                        if (eventArgs.template) {
                            markerTemplateCount++;
                            markerTemplate(eventArgs, templateFn, markerID, data, markerIndex, markerTemplateEle, location,
                                scale, offset, this.maps);
                        } else {
                            markerCount++;
                            marker(eventArgs, markerSettings, markerData, dataIndex,
                                location, transPoint, markerID, offset, scale, this.maps, this.markerSVGObject);
                        }
                    }
                    markerTemplateCount += (eventArgs.cancel) ? 1 : 0;                        
                    markerCount += (eventArgs.cancel) ? 1 : 0;                   
                    if (this.markerSVGObject.childElementCount === (markerData.length - markerTemplateCount) && (type !== 'Template')) {
                        layerElement.appendChild(this.markerSVGObject);
                        if (currentLayer.markerClusterSettings.allowClustering) {
                            this.maps.svgObject.appendChild(this.markerSVGObject);
                            this.maps.element.appendChild(this.maps.svgObject);
                            clusterTemplate(currentLayer, this.markerSVGObject,
                                this.maps, layerIndex, this.markerSVGObject, layerElement, true);
                        }
                    }
                    if (markerTemplateEle.childElementCount === (markerData.length - markerCount) && getElementByID(this.maps.element.id + '_Secondary_Element')) {
                        getElementByID(this.maps.element.id + '_Secondary_Element').appendChild(markerTemplateEle);
                        if (currentLayer.markerClusterSettings.allowClustering) {
                            clusterTemplate(currentLayer, markerTemplateEle, this.maps,
                                layerIndex, this.markerSVGObject, layerElement, false);
                        }
                    }
                });

            });
        });
    }

    /**
     * To check and trigger marker click event
     */
    public markerClick(e: PointerEvent): void {
        let target: string = (e.target as Element).id;
        if (target.indexOf('_LayerIndex_') === -1 || target.indexOf('_cluster_') > 0) {
            return;
        }
        let options: { marker: MarkerSettingsModel, data: object } = this.getMarker(target);
        if (isNullOrUndefined(options)) {
            return;
        }
        let eventArgs: IMarkerClickEventArgs = {
            cancel: false, name: markerClick, data: options.data, maps: this.maps,
            marker: options.marker, target: target, x: e.clientX, y: e.clientY,
            latitude : options.data["latitude"] || options.data["Latitude"], longitude : options.data["longitude"] || options.data["Longitude"]
        };
        if (this.maps.isBlazor) {
            const {maps, marker, data, ...blazorEventArgs}: IMarkerClickEventArgs = eventArgs;
            eventArgs = blazorEventArgs;
        }
        this.maps.trigger(markerClick, eventArgs);
    }
    /**
     * To check and trigger Cluster click event
     */
    public markerClusterClick(e: PointerEvent): void {
        let target: string = (e.target as Element).id;
        if (target.indexOf('_LayerIndex_') === -1  || target.indexOf('_cluster_') === -1) {
            return;
        }
        let options: { marker: MarkerSettingsModel, data: object, clusterCollection: MarkerClusterData[] } = this.getMarker(target);
        if (isNullOrUndefined(options)) {
            return;
        }
        if (options.clusterCollection.length > 0) {
            let textElement = document.getElementById(target.indexOf('_datalabel_') > -1 ? target : target + '_datalabel_' + target.split('_cluster_')[1]);
            if (+textElement.textContent === options.clusterCollection[0].data.length) {
                if (this.sameMarkerData.length > 0) {
                    mergeSeparateCluster(this.sameMarkerData, this.maps, this.markerSVGObject);
                }
                this.sameMarkerData = options.clusterCollection;
                clusterSeparate(this.sameMarkerData, this.maps, this.markerSVGObject, true);
            }
        }
        let eventArgs: IMarkerClusterClickEventArgs = {
            cancel: false, name: markerClusterClick, data: options.data, maps: this.maps,
            target: target, x: e.clientX, y: e.clientY,
            latitude : options.data["latitude"] || options.data["Latitude"], longitude : options.data["longitude"] || options.data["Longitude"]
        };
        if (this.maps.isBlazor) {
            const { maps, data, ...blazorEventArgs } : IMarkerClusterClickEventArgs =  eventArgs;
            eventArgs = blazorEventArgs;
        }
        this.maps.trigger(markerClusterClick, eventArgs);
    }
    /**
     * To get marker from target id
     */
    private getMarker(target: string): { marker: MarkerSettingsModel, data: object, clusterCollection: MarkerClusterData[] } {
        let id: string[] = target.split('_LayerIndex_');
        let index: number = parseInt(id[1].split('_')[0], 10);
        let layer: LayerSettings = <LayerSettings>this.maps.layers[index];
        let data: object;
        let clusterCollection: MarkerClusterData[] = [];
        let marker: MarkerSettingsModel;
        if (target.indexOf('_MarkerIndex_') > -1) {
            let markerIndex: number = parseInt(id[1].split('_MarkerIndex_')[1].split('_')[0], 10);
            let dataIndex: number = parseInt(id[1].split('_dataIndex_')[1].split('_')[0], 10);
            marker = layer.markerSettings[markerIndex];
            if (!isNaN(markerIndex)) {
                data = marker.dataSource[dataIndex];
                let collection: Object[] = [];
                if ((this.maps.layers[index].markerClusterSettings.allowClusterExpand) && target.indexOf('_cluster_') > -1) {
                    marker.dataSource.forEach((loc, index) => {
                        if (loc['latitude'] === data['latitude'] && loc['longitude'] === data['longitude']) {
                            collection.push({ data: data, index: index });
                        }
                    });
                    clusterCollection.push(<MarkerClusterData>{
                        data: collection, layerIndex: index, markerIndex: markerIndex,
                        targetClusterIndex: +(target.split('_cluster_')[1].indexOf('_datalabel_') > -1 ? target.split('_cluster_')[1].split('_datalabel_')[0] : target.split('_cluster_')[1])
                    });
                }
                return { marker: marker, data: data, clusterCollection: clusterCollection };
            }
        }
        return null;
    }
    /**
     * To check and trigger marker move event
     */
    public markerMove(e: PointerEvent): void {
        let targetId: string = (e.target as Element).id;
        if (targetId.indexOf('_LayerIndex_') === -1 || targetId.indexOf('_cluster_') > 0 ) {
            return;
        }
        let options: { marker: MarkerSettingsModel, data: object } = this.getMarker(targetId);
        if (isNullOrUndefined(options)) {
            return;
        }
        let eventArgs: IMarkerMoveEventArgs = {
            cancel: false, name: markerMouseMove, data: options.data,
            maps: this.maps, target: targetId, x: e.clientX, y: e.clientY
        };
        if (this.maps.isBlazor) {
            const { maps, ...blazorEventArgs } : IMarkerMoveEventArgs = eventArgs;
            eventArgs = blazorEventArgs;
        }
        this.maps.trigger(markerMouseMove, eventArgs);
    }
    /**
     * To check and trigger cluster move event
     */
    public markerClusterMouseMove(e: PointerEvent): void {
        let targetId: string = (e.target as Element).id;
        if (targetId.indexOf('_LayerIndex_') === -1 || targetId.indexOf('_cluster_') === -1  ) {
            return;
        }
        let options: { marker: MarkerSettingsModel, data: object } = this.getMarker(targetId);
        if (isNullOrUndefined(options)) {
            return;
        }
        let eventArgs: IMarkerClusterMoveEventArgs = {
            cancel: false, name: markerClusterMouseMove, data: options.data, maps: this.maps,
            target: targetId, x: e.clientX, y: e.clientY
        };
        if (this.maps.isBlazor) {
            const { maps, ...blazorEventArgs } : IMarkerClusterMoveEventArgs =  eventArgs;
            eventArgs = blazorEventArgs;
        }
        this.maps.trigger(markerClusterMouseMove, eventArgs);
    }
    /**
     * Get module name.
     */
    protected getModuleName(): string {
        return 'Marker';
    }

    /**
     * To destroy the layers. 
     * @return {void}
     * @private
     */
    public destroy(maps: Maps): void {
        /**
         * Destroy method performed here
         */
    }
}
