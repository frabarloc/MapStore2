import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Field, Form } from 'formik';
import './simulation.css';
import axios from 'axios';
import { usePromiseTracker, trackPromise } from "react-promise-tracker";
import Loader from 'react-loader-spinner';

const LoadingIndicator = () => {
    const { promiseInProgress } = usePromiseTracker();
    return (promiseInProgress &&
        <div
            style={{
                width: "100%",
                height: "100",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}
        >
            <Loader type="ThreeDots" color="#418AA3" height="100" width="100" />
        </div>
    );
};

class SimulationWindowContent extends React.Component {

    static propTypes = {
        urlConfigFile: PropTypes.string,
        urlSimulation: PropTypes.string
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
                <LoadingIndicator/>

                <Formik
                    enableReinitialize
                    initialValues={{
                        task: 'simulation',
                        tramMode: this.state.parameters?.simulation?.input?.tram_mode,
                        includeFaults: this.state.parameters?.simulation?.input?.include_faults_flag,
                        circuitLoadMode: this.state.parameters?.simulation?.network?.circuit_load_mode,
                        includeTracks: this.state.parameters?.simulation?.network?.include_tracks,
                        clearPreviousResults: this.state.parameters?.simulation?.results?.clear_previous_results_flag,
                        uploadTrackResults: this.state.parameters?.simulation?.results?.upload_track_results,
                        maxResZone: this.state.parameters?.simulation?.max_resistance_mode?.zone,
                        maxResLineLength: this.state.parameters?.simulation?.max_resistance_mode?.max_line_length,
                        maxResFaultRes: this.state.parameters?.simulation?.max_resistance_mode?.fault_resistance,
                        allZonesFlag: this.state.parameters?.simulation?.max_resistance_mode?.all_zones_flag
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        this.setState({
                            ...this.state,
                            parameters: {
                                ...this.state.parameters,
                                simulation: {
                                    ...this.state.parameters.simulation,
                                    input: {
                                        tram_mode: values.tramMode,
                                        include_faults_flag: values.includeFaults
                                    },
                                    network: {
                                        circuit_load_mode: values.circuitLoadMode,
                                        include_tracks: values.includeTracks
                                    },
                                    results: {
                                        clear_previous_results_flag: values.clearPreviousResults,
                                        upload_track_results: values.uploadTrackResults
                                    },
                                    max_resistance_mode: {
                                        zone: values.maxResZone,
                                        max_line_length: values.maxResLineLength,
                                        fault_resistance: values.maxResFaultRes,
                                        all_zones_flag: false
                                    }
                                }
                            }
                        });
                        axios.post(this.props.urlConfigFile, this.state)
                            .then(() => trackPromise(
                                fetch(this.props.urlSimulation + '/' + values.task))
                            );
                        setSubmitting(false);
                    }}
                >
                    {({values, isSubmitting}) => (
                        <div>
                            <Form>
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label htmlFor="circuitLoadMode" type="text">Load circuit mode</label>
                                        <Field
                                            className="select-field"
                                            name="circuitLoadMode"
                                            as="select"
                                            disabled={isSubmitting}>
                                            <option value="download">Build</option>
                                            <option value="file">Use last version</option>
                                        </Field>
                                    </div>
                                </div>

                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label type="text">Task</label>
                                        <label>
                                            <Field
                                                className="check-field"
                                                type="radio" name="task"
                                                value="simulation"
                                                disabled={isSubmitting}/>
                                    Simulation
                                        </label>
                                        <label>
                                            <Field
                                                className="check-field"
                                                type="radio" name="task"
                                                value="max_resistance"
                                                disabled={isSubmitting}/>
                                    Max resistance point
                                        </label>
                                    </div>
                                </div>

                                {values.task === 'simulation' && (
                                    <div>
                                        {/* <h3 className="title">Input configuration</h3> */}
                                        <div className="row-sim">
                                            <div className="form-group-col">
                                                <label htmlFor="tramMode" type="text">Input tram mode</label>
                                                <Field
                                                    className="select-field"
                                                    name="tramMode"
                                                    as="select"
                                                    disabled={isSubmitting}>
                                                    <option value="manual">Manual</option>
                                                    <option value="line">Line</option>
                                                </Field>
                                            </div>
                                        </div>

                                        <div className="row-sim">
                                            <div className="form-group-col">
                                                <label className="form-check-label">
                                                    <Field
                                                        className="check-field"
                                                        type="checkbox"
                                                        name="includeFaults"
                                                        disabled={isSubmitting}/>
                                                Include faults
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {values.task === 'max_resistance' && (
                                    <div>
                                        {/* <h3 className="title">Max resistance mode configuration</h3> */}

                                        <div className="row-sim">
                                            <div className="form-group-col">
                                                <label className="form-check-label">
                                                    <Field
                                                        className="check-field"
                                                        type="checkbox"
                                                        name="allZonesFlag"
                                                        disabled={isSubmitting}/>
                                                    Compute all zones
                                                </label>
                                            </div>
                                        </div>

                                        {values.allZonesFlag === false && (
                                            <div className="row-sim">
                                                <div className="form-group-col">
                                                    <label htmlFor="maxResZone">Zone</label>
                                                    <Field
                                                        name="maxResZone"
                                                        type="text"
                                                        disabled={isSubmitting}/>
                                                </div>
                                            </div>
                                        )}
                                        <div className="row-sim">
                                            <div className="form-group-col">
                                                <label htmlFor="maxResFaultRes">Fault resistance (ohm)</label>
                                                <Field
                                                    name="maxResFaultRes"
                                                    type="text"
                                                    disabled={isSubmitting}/>
                                            </div>
                                        </div>
                                        <div className="row-sim">
                                            <div className="form-group-col">
                                                <label htmlFor="maxResLineLength">Fault location resolution (m)</label>
                                                <Field
                                                    name="maxResLineLength"
                                                    type="text"
                                                    disabled={isSubmitting}/>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {/* <h3 className="title">Circuit model</h3> */}
                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label className="form-check-label">
                                            <Field
                                                className="check-field"
                                                type="checkbox"
                                                name="includeTracks"
                                                disabled={isSubmitting}/>
                                            Include tracks
                                        </label>
                                    </div>
                                </div>

                                {/* <h3 className="title">Results</h3> */}

                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <label className="form-check-label">
                                            <Field
                                                className="check-field"
                                                type="checkbox"
                                                name="clearPreviousResults"
                                                disabled={isSubmitting}/>
                                            Delete previous results
                                        </label>
                                    </div>
                                </div>

                                {values.includeTracks === true && (
                                    <div>
                                        <div className="row-sim">
                                            <div className="form-group-col">
                                                <label className="form-check-label">
                                                    <Field
                                                        className="check-field"
                                                        type="checkbox"
                                                        name="uploadTrackResults"
                                                        disabled={isSubmitting}/>
                                                    Upload track results
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="row-sim">
                                    <div className="form-group-col">
                                        <button
                                            className="launch-button"
                                            type="submit"
                                            disabled={isSubmitting}
                                        >Launch
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

export default SimulationWindowContent;
