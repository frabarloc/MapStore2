import React from 'react';
import {connect} from "react-redux";

import SimulationConfigWindow from "./SimulationConfigWindow";

import { Glyphicon } from 'react-bootstrap';
import { toggleControl } from '../../actions/controls';

import {createPlugin} from '../../utils/PluginsUtils';

const mapStateToProps = state => ({
    enabled: state.controls && state.controls.simulationConfig && state.controls.simulationConfig.enabled || false,
    withButton: false
});

const mapDispatchToProps = {
    onClose: toggleControl.bind(null, 'simulationConfig', null)
};

/**
 * Plugin for the "SimulationConfig" window in mapstore.
 * @name SimulationConfig
 * @class
 * @memberof plugins
 * @prop {string} urlConfigFile
 */
export default createPlugin(
    'SimulationConfig', {
        component: connect(mapStateToProps, mapDispatchToProps)(SimulationConfigWindow),
        reducers: {},
        containers: {
            BurgerMenu: {
                name: 'simulationConfig',
                position: 9995,
                text: "configure parameters",
                icon: <Glyphicon glyph="cog"/>,
                action: toggleControl.bind(null, 'simulationConfig', null),
                priority: 1,
                doNotHide: true
            }
        }
    });
