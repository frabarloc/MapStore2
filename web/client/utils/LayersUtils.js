/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import assign from 'object-assign';
import toBbox from 'turf-bbox';
import uuidv1 from 'uuid/v1';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import head from 'lodash/head';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';
import findIndex from 'lodash/findIndex';
import pick from 'lodash/pick';
import isNil from 'lodash/isNil';
import {addAuthenticationParameter} from './SecurityUtils';

let LayersUtils;

let regGeoServerRule = /\/[\w- ]*geoserver[\w- ]*\//;

const getGroup = (groupId, groups) => {
    return head(groups.filter((subGroup) => isObject(subGroup) && subGroup.id === groupId));
};
const getLayer = (layerName, allLayers) => {
    return head(allLayers.filter((layer) => layer.id === layerName));
};
const getLayersId = (groupId, allLayers) => {
    return allLayers.filter((layer) => (layer.group || 'Default') === groupId).map((layer) => layer.id).reverse();
};
/**
 * utility to check
 * @param {object} l layer data
 * @returns wps url or fallback to other layer urls
 */
export const getWpsUrl = l => l && l.wpsUrl || (l.search && l.search.url) || l.url;
const initialReorderLayers = (groups, allLayers) => {
    return groups.slice(0).reverse().reduce((previous, group) => {
        return previous.concat(
            group.nodes.slice(0).reverse().reduce((layers, node) => {
                if (isObject(node)) {
                    return layers.concat(initialReorderLayers([node], allLayers));
                }
                return layers.concat(getLayer(node, allLayers));
            }, [])
        );
    }, []);
};
const reorderLayers = (groups, allLayers) => {
    return initialReorderLayers(groups, allLayers);
};
const createGroup = (groupId, groupTitle, groupName, layers, addLayers) => {
    return assign({}, {
        id: groupId,
        title: groupTitle ?? (groupName || "").replace(/\${dot}/g, "."),
        name: groupName,
        nodes: addLayers ? getLayersId(groupId, layers) : [],
        expanded: true
    });
};

const getElevationDimension = (dimensions = []) => {
    return dimensions.reduce((previous, dim) => {
        return dim.name.toLowerCase() === 'elevation' || dim.name.toLowerCase() === 'depth' ?
            assign({
                positive: dim.name.toLowerCase() === 'elevation'
            }, dim, {
                name: dim.name.toLowerCase() === 'elevation' ? dim.name : 'DIM_' + dim.name
            }) : previous;
    }, null);
};

const addBaseParams = (url, params) => {
    const query = Object.keys(params).map((key) => key + '=' + encodeURIComponent(params[key])).join('&');
    return url.indexOf('?') === -1 ? (url + '?' + query) : (url + '&' + query);
};

const isSupportedLayerFunc = (layer, maptype) => {
    const LayersUtil = require('./' + maptype + '/Layers');
    const Layers = LayersUtil.default || LayersUtil;
    if (layer.type === "mapquest" || layer.type === "bing") {
        return Layers.isSupported(layer.type) && layer.apiKey && layer.apiKey !== "__API_KEY_MAPQUEST__" && !layer.invalid;
    }

    /*
     * type 'empty' represents 'No background' layer
     * previously was checking for types
    */
    if (layer.type === 'empty') {
        return true;
    }
    return Layers.isSupported(layer.type) && !layer.invalid;
};


const checkInvalidParam = (layer) => {
    return layer && layer.invalid ? assign({}, layer, {invalid: false}) : layer;
};

export const getNode = (nodes, id) => {
    if (nodes && isArray(nodes)) {
        return nodes.reduce((previous, node) => {
            if (previous) {
                return previous;
            }
            if (node && (node.name === id || node.id === id || node === id)) {
                return node;
            }
            if (node && node.nodes && node.nodes.length > 0) {
                return getNode(node.nodes, id);
            }
            return previous;
        }, null);
    }
    return null;
};

export const getGroupNodes = (node) => {
    if (node && node.nodes) {
        return node.nodes.reduce((a, b) => {
            let nodes = [].concat(a);
            if (b.nodes) {
                nodes = a.concat(getGroupNodes(b));
            }
            if (isString(b)) {
                return [...nodes, b];
            }
            return [...nodes, b.id];
        }, []);
    }
    return [];
};

/**
 * Gets title of nested groups from Default
 * @param {string} id of group
 * @param {array} groups groups of map
 * @return {string} title of the group
 */
export const getNestedGroupTitle = (id, groups = []) => {
    return isArray(groups) && head(groups.map(group => {
        const groupObj = group.id === id ? group : null;
        if (groupObj) {
            return groupObj.title;
        }
        const nodeObj = getNode(group.nodes, id);
        return nodeObj ? nodeObj.title : null;
    }));
};

/**
 * Flatten nested groupDetails to a one-level groupDetails
 * @param {(Object[]|Object)} groupDetails of objects
 * @returns {Object[]} flattened groupDetails
 */
export const flattenArrayOfObjects = (groupDetails) => {
    let result = [];
    groupDetails && castArray(groupDetails).forEach((a) => {
        result.push(a);
        if (a.nodes && Array.isArray(groupDetails) && Array.isArray(a.nodes)) {
            result = result.concat(flattenArrayOfObjects(a.nodes));
        }
    });
    return result;
};

/**
 * Gets group title by id
 * @param {string} id of group
 * @param {object[]} groups groups of map
 * @returns {string} title of the group
 */

export const displayTitle = (id, groups) => {
    if (groups && Array.isArray(groups)) {
        for (let group of groups) {
            if (group?.id === id) {
                return group.title;
            }
        }
    }
    return 'Default';
};
/**
 * adds or update node property in a nested node
 * if propName is an object it overrides a whole group of options instead of one
 */
export const deepChange = (nodes, findValue, propName, propValue) => {
    if (nodes && isArray(nodes) && nodes.length > 0) {
        return nodes.map((node) => {
            if (isObject(node)) {
                if (node.id === findValue) {
                    return {...node, ...(isObject(propName) ? propName : {[propName]: propValue})};
                } else if (node.nodes) {
                    return {...node, nodes: deepChange(node.nodes, findValue, propName, propValue)};
                }
            }
            return node;
        });
    }
    return [];
};

/**
 * Extracts the sourceID of a layer.
 * @param {object} layer the layer object
 */
export const getSourceId = (layer = {}) => layer.capabilitiesURL || head(castArray(layer.url));
/**
 * It extracts tile matrix set from sources and add them to the layer
 *
 * @param sources {object} sources object from state or configuration
 * @param layer {object} layer to check
 * @return {object} new layers with tileMatrixSet and matrixIds (if needed)
 */
export const  extractTileMatrixFromSources = (sources, layer) => {
    if (!sources || !layer) {
        return {};
    }
    if (!isArray(layer.matrixIds) && isObject(layer.matrixIds)) {
        layer.matrixIds = [...Object.keys(layer.matrixIds)];
    }
    const sourceId = getSourceId(layer);
    const matrixIds = layer.matrixIds && layer.matrixIds.reduce((a, mI) => {
        const ids = sources[sourceId] && sources[sourceId].tileMatrixSet && sources[sourceId].tileMatrixSet[mI] && sources[sourceId].tileMatrixSet[mI].TileMatrix.map(i => ({identifier: i['ows:Identifier'], ranges: i.ranges})) || [];
        return ids.length === 0 ? assign({}, a) : assign({}, a, {[mI]: [...ids]});
    }, {}) || null;
    const tileMatrixSet = layer.tileMatrixSet && layer.matrixIds.map(mI => sources[sourceId].tileMatrixSet[mI]).filter(v => v) || null;
    return tileMatrixSet && matrixIds && {tileMatrixSet, matrixIds} || {};
};

/**
 * It extracts tile matrix set from layers and add them to sources map object
 *
 * @param  {object} sourcesFromLayers layers grouped by url
 * @param {object} [sources] current sources map object
 * @return {object} new sources object with data from layers
 */
export const extractTileMatrixSetFromLayers = (sourcesFromLayers, sources = {}) => {
    return sourcesFromLayers && Object.keys(sourcesFromLayers).reduce((src, url) => {
        const matrixIds = sourcesFromLayers[url].reduce((a, b) => {
            return assign(a, { [b.id || b.name]: { srs: [...Object.keys(b.matrixIds)], matrixIds: assign({}, b.matrixIds) } });
        }, {});

        const newMatrixSet = sourcesFromLayers[url].reduce((nMS, l) => {

            const matrixSetObject = l.tileMatrixSet.reduce((i, tM) => assign({}, i, { [tM['ows:Identifier']]: assign({}, tM) }), {});

            const matrixFilteredByLayers = Object.keys(matrixSetObject).reduce((mFBL, key) => {

                const layers = Object.keys(matrixIds)
                    .filter(layerId => head(matrixIds[layerId].srs.filter(mId => mId === key)))
                    .map(layerId => matrixIds[layerId].matrixIds[key]);

                const TileMatrix = layers[0] && matrixSetObject[key].TileMatrix.map((m, idx) => layers[0][idx] && layers[0][idx].ranges ? assign({}, m, { ranges: layers[0][idx].ranges }) : assign({}, m));

                return !head(layers) ? assign({}, mFBL) : assign({}, mFBL, { [key]: assign({}, matrixSetObject[key], { TileMatrix }) });
            }, {});

            return assign({}, nMS, matrixFilteredByLayers);
        }, {});
        return assign({}, src, { [url]: assign({}, sources[url] || {}, { tileMatrixSet: assign({}, src[url] && src[url].tileMatrixSet || {}, newMatrixSet) }) });
    }, assign({}, sources)) || sources;
};

/**
 * Creates a map of `sourceId: sourceObject` from the layers array.
 * @param {object[]} layers array of layer objects
 */
export const extractSourcesFromLayers = layers => {
    /* layers grouped by url to create the source object */
    const groupByUrl = layers.filter(l => l.tileMatrixSet).reduce((a, l) => {
        const sourceId = getSourceId(l);
        return a[sourceId] ? assign({}, a, { [sourceId]: [...a[sourceId], l] }) : assign({}, a, { [sourceId]: [l] });
    }, {});

    /* extract and add tilematrixset to sources object  */
    return extractTileMatrixSetFromLayers(groupByUrl);
};

/**
 * It extracts data from configuration sources and add them to the layers
 *
 * @param mapState {object} state of map, must contains layers array
 * @return {object} new sources object with data from layers
 */

export const extractDataFromSources = mapState => {
    if (!mapState || !mapState.layers || !isArray(mapState.layers)) {
        return null;
    }
    const sources = mapState.mapInitialConfig && mapState.mapInitialConfig.sources && assign({}, mapState.mapInitialConfig.sources) || {};

    return !isEmpty(sources) ? mapState.layers.map(l => {

        const tileMatrix = extractTileMatrixFromSources(sources, l);

        return assign({}, l, tileMatrix);
    }) : [...mapState.layers];
};

export const getURLs = (urls, queryParametersString = '') => {
    return urls.map((url) => url.split("\?")[0] + queryParametersString);
};


const LayerCustomUtils = {};
/**
 * Return a base url for the given layer.
 * Supports multiple urls.
 */

export const getLayerUrl = (layer) => {
    return isArray(layer.url) ? layer.url[0] : layer.url;
};

export const getGroupByName = (groupName, groups = []) => {
    const result = head(groups.filter(g => g.name === groupName));
    return result || groups.reduce((prev, g) => prev || !!g.nodes && LayersUtils.getGroupByName(groupName, g.nodes), undefined);
};
export const getDimension = (dimensions, dimension) => {
    switch (dimension.toLowerCase()) {
    case 'elevation':
        return getElevationDimension(dimensions);
    default:
        return null;
    }
};
/**
 * Returns an id for the layer. If the layer has layer.id returns it, otherwise it will return a generated id.
 * If the layer doesn't have any layer and if the 2nd argument is passed (it should be an array),
 * the layer id will returned will be something like `layerName__2` when 2 is the layer size (for retro compatibility, it should be removed in the future).
 * Otherwise a random string will be appended to the layer name.
 * @param {object} layer the layer
 * @param {array} [layers] an array to use to generate the id @deprecated
 * @returns {string} the id of the layer, or a generated one
 */
export const getLayerId = (layerObj, layers) => {
    return layerObj && layerObj.id || layerObj.name + "__" + (layers ? layers.length : Math.random().toString(36).substring(2, 15));
};
/**
 * Normalizes the layer to assign missing Ids
 * @param {object} layer the layer to normalize
 * @returns {object} the normalized layer
 */
export const normalizeLayer = (layer) => layer.id ? layer : { ...layer, id: LayersUtils.getLayerId(layer) };
/**
 * Normalizes the map adding missing ids, default groups.
 * @param {object} map the map
 * @param {object} the normalized map
 */
export const normalizeMap = (rawMap = {}) =>
    [
        (map) => (map.layers || []).filter(({ id } = {}) => !id).length > 0 ? {...map, layers: (map.layers || []).map(l => LayersUtils.normalizeLayer(l))} : map,
        (map) => map.groups ? map : {...map, groups: {id: "Default", expanded: true}}
        // this is basically a compose
    ].reduce((f, g) => (...args) => f(g(...args)))(rawMap);
/**
 * @param gid
 * @return function that filter by group
 */
export const belongsToGroup = (gid) => l => (l.group || "Default") === gid || (l.group || "").indexOf(`${gid}.`) === 0;
export const getLayersByGroup = (configLayers, configGroups) => {
    let i = 0;
    let mapLayers = configLayers.map((layer) => assign({}, layer, {storeIndex: i++}));
    let groupNames = mapLayers.reduce((groups, layer) => {
        return groups.indexOf(layer.group || 'Default') === -1 ? groups.concat([layer.group || 'Default']) : groups;
    }, []).filter((group) => group !== 'background').reverse();
    return groupNames.reduce((groups, names)=> {
        let name = names || 'Default';
        name.split('.').reduce((subGroups, groupName, idx, array)=> {
            const groupId = name.split(".", idx + 1).join('.');
            let group = getGroup(groupId, subGroups);
            const addLayers = idx === array.length - 1;
            if (!group) {
                const flattenGroups = flattenArrayOfObjects(configGroups);
                const groupTitle = displayTitle(groupId, flattenGroups);
                group = createGroup(groupId, groupTitle || groupName, groupName, mapLayers, addLayers);
                subGroups.push(group);
            } else if (addLayers) {
                group.nodes = getLayersId(groupId, mapLayers).concat(group.nodes)
                    .reduce((arr, cur) => {
                        isObject(cur)
                            ? arr.push({node: cur, order: mapLayers.find((el) => el.group === cur.id)?.storeIndex})
                            : arr.push({node: cur, order: mapLayers.find((el) => el.id === cur)?.storeIndex});
                        return arr;
                    }, []).sort((a, b) => b.order - a.order).map(e => e.node);
            }
            return group.nodes;
        }, groups);
        return groups;
    }, []);
};
export const removeEmptyGroups = (groups) => {
    return groups.reduce((acc, group) => {
        return acc.concat(LayersUtils.getNotEmptyGroup(group));
    }, []);
};
export const getNotEmptyGroup = (group) => {
    const nodes = group.nodes.reduce((gNodes, node) => {
        return node.nodes ? gNodes.concat(LayersUtils.getNotEmptyGroup(node)) : gNodes.concat(node);
    }, []);
    return nodes.length > 0 ? assign({}, group, {nodes: nodes}) : [];
};
export const reorderFunc = (groups, allLayers) => {
    return allLayers.filter((layer) => layer.group === 'background')
        .concat(reorderLayers(groups, allLayers));
};
export const denormalizeGroups = (allLayers, groups) => {
    let getGroupVisibility = (nodes) => {
        let visibility = true;
        nodes.forEach((node) => {
            if (!node.visibility) {
                visibility = false;
            }
        });
        return visibility;
    };
    let getNormalizedGroup = (group, layers) => {
        const nodes = group.nodes.map((node) => {
            if (isObject(node)) {
                return getNormalizedGroup(node, layers);
            }
            return layers.filter((layer) => layer.id === node)[0];
        });
        return assign({}, group, {nodes, visibility: getGroupVisibility(nodes)});
    };
    let normalizedLayers = allLayers.map((layer) => assign({}, layer, {expanded: layer.expanded || false}));
    return {
        flat: normalizedLayers,
        groups: groups.map((group) => getNormalizedGroup(group, normalizedLayers))
    };
};

export const sortLayers = (groups, allLayers) => {
    return allLayers.filter((layer) => layer.group === 'background')
        .concat(reorderLayers(groups, allLayers));
};
export const toggleByType = (type, toggleFun) => {
    return (node, status) => {
        return toggleFun(node, type, status);
    };
};
export const sortUsing = (sortFun, action) => {
    return (node, reorder) => {
        return action(node, reorder, sortFun);
    };
};
export const splitMapAndLayers = (mapState) => {
    if (mapState && isArray(mapState.layers)) {
        let groups = LayersUtils.getLayersByGroup(mapState.layers, mapState.groups);
        // additional params from saved configuration
        if (isArray(mapState.groups)) {
            groups = mapState.groups.reduce((g, group) => {
                let newGroups = g;
                if (group.title) {
                    const groupMetadata = {
                        title: group.title,
                        description: group.description,
                        tooltipOptions: group.tooltipOptions,
                        tooltipPlacement: group.tooltipPlacement
                    };
                    newGroups = LayersUtils.deepChange(newGroups, group.id, groupMetadata);
                }
                newGroups = LayersUtils.deepChange(newGroups, group.id, 'expanded', group.expanded);
                return newGroups;
            }, [].concat(groups));
        }

        let layers = extractDataFromSources(mapState);

        return assign({}, mapState, {
            layers: {
                flat: LayersUtils.reorder(groups, layers),
                groups: groups
            }
        });
    }
    return mapState;
};
/**
 * used for converting a geojson file with fileName into a vector layer
 * it supports FeatureCollection or Feature
 * @param {object} geoJSON object to put into features
 * @param {string} id layer id
 * @return {object} vector layer containing the geojson in features array
 */
export const geoJSONToLayer = (geoJSON, id) => {
    const bbox = toBbox(geoJSON);
    let features = [];
    if (geoJSON.type === "FeatureCollection") {
        features = geoJSON.features.map((feature, idx) => {
            if (!feature.id) {
                feature.id = idx;
            }
            if (feature.geometry && feature.geometry.bbox && isNaN(feature.geometry.bbox[0])) {
                feature.geometry.bbox = [null, null, null, null];
            }
            return feature;
        });
    } else {
        features = [pick({...geoJSON, id: isNil(geoJSON.id) ? uuidv1() : geoJSON.id}, ["geometry", "type", "style", "id"])];
    }
    return {
        type: 'vector',
        visibility: true,
        group: 'Local shape',
        id,
        name: geoJSON.fileName,
        hideLoading: true,
        bbox: {
            bounds: {
                minx: bbox[0],
                miny: bbox[1],
                maxx: bbox[2],
                maxy: bbox[3]
            },
            crs: "EPSG:4326"
        },
        features
    };
};
export const saveLayer = (layer) => {
    return assign({
        id: layer.id,
        features: layer.features,
        format: layer.format,
        thumbURL: layer.thumbURL && layer.thumbURL.split(':')[0] === 'blob' ? undefined : layer.thumbURL,
        group: layer.group,
        search: layer.search,
        source: layer.source,
        name: layer.name,
        opacity: layer.opacity,
        provider: layer.provider,
        description: layer.description,
        styles: layer.styles,
        style: layer.style,
        styleName: layer.styleName,
        layerFilter: layer.layerFilter,
        title: layer.title,
        transparent: layer.transparent,
        tiled: layer.tiled,
        type: layer.type,
        url: layer.url,
        bbox: layer.bbox,
        visibility: layer.visibility,
        singleTile: layer.singleTile || false,
        allowedSRS: layer.allowedSRS,
        matrixIds: layer.matrixIds,
        tileMatrixSet: layer.tileMatrixSet,
        requestEncoding: layer.requestEncoding,
        dimensions: layer.dimensions || [],
        maxZoom: layer.maxZoom,
        maxNativeZoom: layer.maxNativeZoom,
        maxResolution: layer.maxResolution,
        minResolution: layer.minResolution,
        disableResolutionLimits: layer.disableResolutionLimits,
        hideLoading: layer.hideLoading || false,
        handleClickOnLayer: layer.handleClickOnLayer || false,
        queryable: layer.queryable,
        featureInfo: layer.featureInfo,
        catalogURL: layer.catalogURL,
        capabilitiesURL: layer.capabilitiesURL,
        useForElevation: layer.useForElevation || false,
        hidden: layer.hidden || false,
        origin: layer.origin,
        thematic: layer.thematic,
        tooltipOptions: layer.tooltipOptions,
        tooltipPlacement: layer.tooltipPlacement,
        legendOptions: layer.legendOptions,
        tileSize: layer.tileSize,
        version: layer.version
    },
    layer.params ? { params: layer.params } : {},
    layer.credits ? { credits: layer.credits } : {},
    layer.extendedParams ? { extendedParams: layer.extendedParams } : {},
    layer.localizedLayerStyles ? { localizedLayerStyles: layer.localizedLayerStyles } : {});
};
/**
 * default initial constant regex rule for searching for a /geoserver/ string in a url
 * useful for a reset to an initial state of the rule
 */
export const REG_GEOSERVER_RULE = regGeoServerRule;
/**
 * Override default REG_GEOSERVER_RULE variable
 * @param {regex} regex custom regex to override
 */
export const setRegGeoserverRule = (regex) => {
    regGeoServerRule = regex;
};
/**
 * Get REG_GEOSERVER_RULE regex variable
 */
export const getRegGeoserverRule = () => regGeoServerRule;
/**
 * it tests if a url is matched by a regex,
 * if so it returns the matched string
 * otherwise returns null
 * @param object.regex the regex to use for parsing the url
 * @param object.url the url to test
 */
export const findGeoServerName = ({url, regexRule}) => {
    const regex = regexRule || LayersUtils.getRegGeoserverRule();
    const location = isArray(url) ? url[0] : url;
    return regex.test(location) && location.match(regex)[0] || null;
};

/**
 * This method search for a /geoserver/  string inside the url
 * if it finds it returns a getCapabilitiesUrl to a single layer if it has a name like WORKSPACE:layerName
 * otherwise it returns the default getCapabilitiesUrl
 */
export const getCapabilitiesUrl = (layer) => {
    const matchedGeoServerName = LayersUtils.findGeoServerName({url: layer.url});
    let reqUrl = getLayerUrl(layer);
    if (!!matchedGeoServerName) {
        let urlParts = reqUrl.split(matchedGeoServerName);
        if (urlParts.length === 2) {
            let layerParts = layer.name.split(":");
            if (layerParts.length === 2) {
                reqUrl = urlParts[0] + matchedGeoServerName + layerParts [0] + "/" + layerParts[1] + "/" + urlParts[1];
            }
        }
    }
    const params = {
        ...layer.baseParams,
        ...layer.params
    };
    return addBaseParams(reqUrl, params);
};
/**
 * Gets the layer search url or the current url
 *
 * @memberof utils.LayerUtils
 * @param {Object} layer
 * @returns {string} layer url
 */
export const getSearchUrl = (l = {}) => l.search && l.search.url || l.url;
export const invalidateUnsupportedLayer = (layer, maptype) => {
    return isSupportedLayerFunc(layer, maptype) ? checkInvalidParam(layer) : assign({}, layer, {invalid: true});
};
/**
 * Establish if a layer is supported or not
 * @return {boolean} value
 */
export const isSupportedLayer = (layer, maptype) => {
    return !!isSupportedLayerFunc(layer, maptype);
};
export const getLayerTitleTranslations = (capabilities) => {
    return !!LayerCustomUtils.getLayerTitleTranslations ? LayerCustomUtils.getLayerTitleTranslations(capabilities) : capabilities.Title;
};
export const setCustomUtils = (type, fun) => {
    LayerCustomUtils[type] = fun;
};

export const getAuthenticationParam = options => {
    const urls = getURLs(isArray(options.url) ? options.url : [options.url]);
    let authenticationParam = {};
    urls.forEach(url => {
        addAuthenticationParameter(url, authenticationParam, options.securityToken);
    });
    return authenticationParam;
};
/**
 * Removes google backgrounds and select an alternative one as visible
 * returns a new list of layers modified accordingly
 */
export const excludeGoogleBackground = ll => {
    const hasVisibleGoogleBackground = ll.filter(({ type, group, visibility } = {}) => group === 'background' && type === 'google' && visibility).length > 0;
    const layers = ll.filter(({ type } = {}) => type !== 'google');
    const backgrounds = layers.filter(({ group } = {}) => group === 'background');

    // check if the selection of a new background is required
    if (hasVisibleGoogleBackground && backgrounds.filter(({ visibility } = {}) => visibility).length === 0) {
        // select the first available
        if (backgrounds.length > 0) {
            const candidate = findIndex(layers, {group: 'background'});
            return layers.map((l, i) => i === candidate ? {...l, visibility: true} : l);
        }
        // add osm if any other background is missing
        return [{
            "type": "osm",
            "title": "Open Street Map",
            "name": "mapnik",
            "source": "osm",
            "group": "background",
            "visibility": true
        }, ...layers];


    }
    return layers;
};
export const creditsToAttribution = ({ imageUrl, link, title }) => {
    // TODO: check if format is valid for an img (svg, for instance, may not work)
    const html = imageUrl ? `<img src="${imageUrl}" ${title ? `title="${title}"` : ``}>` : title;
    return link && html ? `<a href="${link}" target="_blank">${html}</a>` : html;
};
/**
 * Return capabilities valid for the layer object
 */
export const formatCapabitiliesOptions = function(capabilities) {
    return isObject(capabilities)
        ? {
            capabilities,
            capabilitiesLoading: null,
            description: capabilities._abstract,
            boundingBox: capabilities.latLonBoundingBox,
            availableStyles: capabilities.style && (Array.isArray(capabilities.style) ? capabilities.style : [capabilities.style])
        }
        : {};
};
export const getLayerTitle = ({title, name}, currentLocale = 'default') => title?.[currentLocale] || title?.default || title || name;

/**
 * Check if a resolution is inside of the min and max resolution limits of a layer
 * @param {object} layer layer object
 * @param {number} resolution resolutions of the current view
 */
export const isInsideResolutionsLimits = (layer, resolution) => {
    if (layer.disableResolutionLimits) {
        return true;
    }
    const minResolution = layer.minResolution || -Infinity;
    const maxResolution = layer.maxResolution || Infinity;
    return resolution !== undefined
        ? resolution < maxResolution && resolution >= minResolution
        : true;
};

/**
 * Filter array of layers to return layers with visibility key set to true
 * @param {Array} layers
 * @param {Array} timelineLayers
 * @returns {Array}
 */
export const visibleTimelineLayers = (layers, timelineLayers) => {
    return layers.filter(layer => {
        let timelineLayer = timelineLayers?.find(item => item.id === layer.id);
        return timelineLayer?.visibility ? layer : null;
    });
};

/**
 * Loop through array of timeline layers to determine if any of the layers is visible
 * @param {Array} layers
 * @returns {boolean}
 */
export const isTimelineVisible = (layers)=>{
    for (let layer of layers) {
        if (layer?.visibility) {
            return true;
        }
    }
    return false;
};

LayersUtils = {
    getGroupByName,
    getLayerId,
    normalizeLayer,
    getNotEmptyGroup,
    getLayersByGroup,
    deepChange,
    reorder: reorderFunc,
    getRegGeoserverRule,
    findGeoServerName,
    isInsideResolutionsLimits,
    visibleTimelineLayers
};
