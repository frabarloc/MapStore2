import React from "react";
import PropTypes from 'prop-types';

import InfoButton from '../../components/buttons/InfoButton';
import Dialog from '../../components/misc/Dialog';
// import { Message } from '../../components/I18N/I18N';
import aboutImg from '../../product/assets/img/Blank.gif';
import assign from 'object-assign';
import { Glyphicon } from 'react-bootstrap';
import SwitchesConfigWindowContent from './SwitchesConfigWindowContent';
import axios from 'axios';

class SwitchesConfigWindow extends React.Component {
    static propTypes = {
        style: PropTypes.object,
        modalConfig: PropTypes.object,
        withButton: PropTypes.bool,
        enabled: PropTypes.bool,
        onClose: PropTypes.func,
        urlSwitchesConfigFile: PropTypes.string
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
        urlSwitchesConfigFile: "http://localhost:8084/app/switches_config_file"
    };

    constructor(props) {
        super(props);
        this.state = {
            type: '',
            content: [
            ]
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.enabled !== prevProps.enabled) {
            axios.get(this.props.urlSwitchesConfigFile)
                .then(response => {
                    this.setState({type: response.data.type});
                    this.setState({content: response.data.content});
                });
        }
    }

    render() {
        return this.props.withButton ? (
            <InfoButton
                {...this.props.modalConfig}
                image={aboutImg}
                title="Switches"
                btnType="image"
                className="map-logo"
                body={
                    <SwitchesConfigWindowContent
                        content={this.state.content}
                        urlSwitchesConfigFile={this.props.urlSwitchesConfigFile}
                    />
                }/>) : (
            <Dialog
                id="mapstore-about"
                style={assign({}, {
                    zIndex: 1992,
                    display: this.props.enabled ? "block" : "none",
                    width: 'auto',
                    height: 'auto',
                    'min-width': 400
                })}
                modal
                draggable
            >
                <span role="header">
                    <span className="about-panel-title">
                        Switches configuration
                    </span>
                    <button onClick={this.props.onClose} className="about-panel-close close">
                        {this.props.modalConfig.closeGlyph ? <Glyphicon glyph={this.props.modalConfig.closeGlyph}/> : <span>×</span>}
                    </button>
                </span>
                <div role="body">
                    <SwitchesConfigWindowContent
                        content={this.state.content}
                        urlSwitchesConfigFile={this.props.urlSwitchesConfigFile}
                    />
                </div>
            </Dialog>);
    }
}

export default SwitchesConfigWindow;
