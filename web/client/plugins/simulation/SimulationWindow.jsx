import React from "react";
import PropTypes from 'prop-types';

import InfoButton from '../../components/buttons/InfoButton';
import Dialog from '../../components/misc/Dialog';
import aboutImg from '../../product/assets/img/Blank.gif';
import assign from 'object-assign';
import { Glyphicon } from 'react-bootstrap';
import SimulationWindowContent from './SimulationWindowContent';

class SimulationWindow extends React.Component {
    static propTypes = {
        style: PropTypes.object,
        modalConfig: PropTypes.object,
        withButton: PropTypes.bool,
        enabled: PropTypes.bool,
        onClose: PropTypes.func,
        urlConfigFile: PropTypes.string,
        urlSimulation: PropTypes.string
    };
    static defaultProps = {
        style: {
            position: "absolute",
            zIndex: 1000,
            bottom: "-8px",
            right: "0px",
            margin: "8px"
        },
        modalConfig: {
            closeGlyph: "1-close"
        },
        withButton: true,
        enabled: false,
        onClose: () => {},
        urlConfigFile: "http://localhost:8084/app/config_file",
        urlSimulation: "http://localhost:8084/app/simulation"
    };

    render() {
        return this.props.withButton ? (
            <InfoButton
                {...this.props.modalConfig}
                image={aboutImg}
                title="Simulation"
                btnType="image"
                className="map-logo"
                body={
                    <SimulationWindowContent
                        urlConfigFile={this.props.urlConfigFile}
                        urlSimulation={this.props.urlSimulation}
                    />
                }/>) : (
            <Dialog
                id="mapstore-about"
                style={assign({}, {
                    zIndex: 1992,
                    display: this.props.enabled ? "block" : "none",
                    'overflow-x': 'auto',
                    'overflow-y': 'auto',
                    width: 'auto',
                    height: 'auto',
                    'max-width': 800,
                    'min-width': 400
                })}
                modal
                draggable
            >
                <span role="header">
                    <span className="about-panel-title">
                        Simulation
                    </span>
                    <button onClick={this.props.onClose} className="about-panel-close close">
                        {this.props.modalConfig.closeGlyph ? <Glyphicon glyph={this.props.modalConfig.closeGlyph}/> : <span>×</span>}
                    </button>
                </span>
                <div role="body">
                    <SimulationWindowContent
                        urlConfigFile={this.props.urlConfigFile}
                        urlSimulation={this.props.urlSimulation}
                    />
                </div>
            </Dialog>);
    }
}

export default SimulationWindow;
