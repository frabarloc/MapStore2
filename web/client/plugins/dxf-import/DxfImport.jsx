import React from 'react';
import {connect} from "react-redux";
import { Glyphicon } from 'react-bootstrap';
import { toggleControl } from '../../actions/controls';
import {createPlugin} from '../../utils/PluginsUtils';
import DxfImportWindow from "./DxfImportWindow";

const mapStateToProps = state => ({
    enabled: state.controls && state.controls.dxfImport && state.controls.dxfImport.enabled || false,
    withButton: false
});

const mapDispatchToProps = {
    onClose: toggleControl.bind(null, 'dxfImport', null)
};

/**
 * Plugin for the "DxfImport" window in mapstore.
 * @name DxfImport
 * @class
 * @memberof plugins
 * @prop {string} urlConfigFile
 * @prop {string} urlDxfFile
 */
export default createPlugin(
    'DxfImport', {
        component: connect(mapStateToProps, mapDispatchToProps)(DxfImportWindow),
        reducers: {},
        containers: {
            BurgerMenu: {
                name: 'import dxf',
                position: 9991,
                text: "import dxf",
                icon: <Glyphicon glyph="upload"/>,
                action: toggleControl.bind(null, 'dxfImport', null),
                priority: 1,
                doNotHide: true
            }
        }
    });
