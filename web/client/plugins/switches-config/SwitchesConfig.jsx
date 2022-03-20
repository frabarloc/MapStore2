import React from 'react';
import {connect} from "react-redux";

import SwitchesConfigWindow from "./SwitchesConfigWindow";

import { Glyphicon } from 'react-bootstrap';
import { toggleControl } from '../../actions/controls';

import {createPlugin} from '../../utils/PluginsUtils';

const mapStateToProps = state => ({
    enabled: state.controls && state.controls.switchesConfig && state.controls.switchesConfig.enabled || false,
    withButton: false
});

const mapDispatchToProps = {
    onClose: toggleControl.bind(null, 'switchesConfig', null)
};

/**
 * Plugin for the "SwitchesConfig" window in mapstore.
 * @name SwitchesConfig
 * @class
 * @memberof plugins
 * @prop {string} urlSwitchesConfigFile
 */
export default createPlugin(
    'SwitchesConfig', {
        component: connect(mapStateToProps, mapDispatchToProps)(SwitchesConfigWindow),
        reducers: {},
        containers: {
            BurgerMenu: {
                name: 'switchesConfig',
                position: 9992,
                text: "configure switches",
                icon: <Glyphicon glyph="cog"/>,
                action: toggleControl.bind(null, 'switchesConfig', null),
                priority: 1,
                doNotHide: true
            }
        }
    });
