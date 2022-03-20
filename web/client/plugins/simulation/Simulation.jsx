import React from 'react';
import {connect} from "react-redux";

import SimulationWindow from "./SimulationWindow";

import { Glyphicon } from 'react-bootstrap';
import { toggleControl } from '../../actions/controls';

import {createPlugin} from '../../utils/PluginsUtils';

const mapStateToProps = state => ({
    enabled: state.controls && state.controls.simulation && state.controls.simulation.enabled || false,
    withButton: false
});

const mapDispatchToProps = {
    onClose: toggleControl.bind(null, 'simulation', null)
};

/**
 * Plugin for the "Simulation" window in mapstore.
 * @name Simulation
 * @class
 * @memberof plugins
 * @prop {string} urlConfigFile
 * @prop {string} urlSimulation
 */
export default createPlugin(
    'Simulation', {
        component: connect(mapStateToProps, mapDispatchToProps)(SimulationWindow),
        reducers: {},
        containers: {
            BurgerMenu: {
                name: 'simulation',
                position: 9990,
                text: "simulation",
                icon: <Glyphicon glyph="wrench"/>,
                action: toggleControl.bind(null, 'simulation', null),
                priority: 1,
                doNotHide: true
            }
        }
    });
