import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Field, Form } from 'formik';
import './simulationConfig.css';
import axios from 'axios';

class SimulationConfigWindowContent extends React.Component {

    static propTypes = {
        urlConfigFile: PropTypes.string
    };

    constructor(props) {
        super(props);
        this.state = {
            type: '',
            parameters: {
            }
        };
    }

    componentDidMount() {
        axios.get(this.props.urlConfigFile)
            .then(response => {
                this.setState({type: response.data.type});
                this.setState({parameters: response.data.parameters});
            });
    }

    render() {
        return (
            <div>
                <Formik
                    enableReinitialize
                    initialValues={{
                        genResistanceOn: this.state.parameters?.circuit_model?.generators?.series_resistance_on,
                        genResistanceOff: this.state.parameters?.circuit_model?.generators?.series_resistance_off,
                        genVccOn: this.state.parameters?.circuit_model?.generators?.Vcc_on,
                        genVccOff: this.state.parameters?.circuit_model?.generators?.Vcc_off,

                        radiusCPosConnect: this.state.parameters?.circuit_model?.cabins?.radius_of_positive_cable_connection,
                        radiusCNegConnect: this.state.parameters?.circuit_model?.cabins?.radius_of_negative_cable_connection,

                        cablesResistivity: this.state.parameters?.circuit_model?.cables?.cables_resistivity,
                        aerialLinesSection: this.state.parameters?.circuit_model?.cables?.section_LA,
                        trackResistivity: this.state.parameters?.circuit_model?.cables?.track_resistivity,
                        trackSection: this.state.parameters?.circuit_model?.cables?.track_section,
                        radiusConnect: this.state.parameters?.circuit_model?.cables?.radius_of_connection,
                        trackConductanceToGroundPerMeter: this.state.parameters?.circuit_model?.cables?.track_stray_conductance_to_ground_per_meter,

                        parallelResTram: this.state.parameters?.circuit_model?.trams?.parallel_resistance,
                        locToleranceTram: this.state.parameters?.circuit_model?.trams?.location_tolerance,

                        locToleranceFault: this.state.parameters?.circuit_model?.faults?.location_tolerance,

                        geoserverHost: this.state.parameters?.geoserver?.host,
                        geoserverPort: this.state.parameters?.geoserver?.port,
                        geoserverWorkspace: this.state.parameters?.geoserver?.workspace,
                        geoserverMaxInsertsPerRequest: this.state.parameters?.geoserver?.max_inserts_per_request,
                        crs: this.state.parameters?.geoserver?.crs
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        this.setState({
                            ...this.state,
                            parameters: {
                                ...this.state.parameters,

                                circuit_model: {
                                    generators: {
                                        series_resistance_on: values.genResistanceOn,
                                        series_resistance_off: values.genResistanceOff,
                                        Vcc_on: values.genVccOn,
                                        Vcc_off: values.genVccOff
                                    },
                                    cabins: {
                                        radius_of_positive_cable_connection: values.radiusCPosConnect,
                                        radius_of_negative_cable_connection: values.radiusCNegConnect
                                    },
                                    cables: {
                                        cables_resistivity: values.cablesResistivity,
                                        section_LA: values.aerialLinesSection,
                                        track_resistivity: values.trackResistivity,
                                        track_section: values.trackSection,
                                        radius_of_connection: values.radiusConnect,
                                        track_stray_conductance_to_ground_per_meter: values.trackConductanceToGroundPerMeter
                                    },
                                    trams: {
                                        parallel_resistance: values.parallelResTram,
                                        location_tolerance: values.locToleranceTram
                                    },
                                    faults: {
                                        location_tolerance: values.locToleranceFault
                                    }
                                },

                                geoserver: {
                                    host: values.geoserverHost,
                                    port: values.geoserverPort,
                                    workspace: values.geoserverWorkspace,
                                    max_inserts_per_request: values.geoserverMaxInsertsPerRequest,
                                    crs: values.crs
                                }
                            }
                        });
                        axios.post(this.props.urlConfigFile, this.state);
                        setSubmitting(false);
                    }}
                >
                    {({isSubmitting}) => (
                        <div>
                            <Form>
                                <h3 className="title">Generators</h3>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Generator series R on</label>
                                        <Field
                                            name="genResistanceOn"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Generator series R off</label>
                                        <Field
                                            name="genResistanceOff"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Generator Vcc on</label>
                                        <Field
                                            name="genVccOn"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Generator Vcc off</label>
                                        <Field
                                            name="genVccOff"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <h3 className="title">Cabins</h3>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Docking radius + (m)</label>
                                        <Field
                                            name="radiusCPosConnect"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Docking radius - (m)</label>
                                        <Field
                                            name="radiusCNegConnect"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>

                                <h3 className="title">Cables</h3>

                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Cables resistivity (ohm m)</label>
                                        <Field
                                            name="cablesResistivity"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Aerieal lines section (m^2)</label>
                                        <Field
                                            name="aerialLinesSection"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Track resistivity (ohm m)</label>
                                        <Field
                                            name="trackResistivity"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Track section (m^2)</label>
                                        <Field
                                            name="trackSection"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Radius of connectivity (m)</label>
                                        <Field
                                            name="radiusConnect"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Conductance to ground (S/m)</label>
                                        <Field
                                            name="trackConductanceToGroundPerMeter"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>

                                <h3 className="title">Trams</h3>

                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Parallel resistance (ohm)</label>
                                        <Field
                                            name="parallelResTram"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Location resolution (m)</label>
                                        <Field
                                            name="locToleranceTram"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>

                                <h3 className="title">Faults</h3>

                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Location resolution (m)</label>
                                        <Field
                                            name="locToleranceFault"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>

                                <h3 className="title">Geoserver</h3>

                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="geoHost">Host</label>
                                        <Field
                                            name="geoserverHost"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="maxResFaultRes">Port</label>
                                        <Field
                                            name="geoserverPort"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="maxResFaultRes">Workspace</label>
                                        <Field
                                            name="geoserverWorkspace"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="maxResFaultRes">Max inserts per request</label>
                                        <Field
                                            name="geoserverMaxInsertsPerRequest"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="maxResFaultRes">CRS</label>
                                        <Field
                                            name="crs"
                                            type="text"
                                            disabled={isSubmitting}/>
                                    </div>
                                </div>

                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <button
                                            className="launch-button"
                                            type="submit"
                                            disabled={isSubmitting}
                                        >Save
                                        </button>
                                    </div>
                                </div>
                            </Form>
                        </div>
                    )}
                </Formik>
            </div>
        );
    }
}

export default SimulationConfigWindowContent;
