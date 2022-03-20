import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Field, Form } from 'formik';
import './DxfImport.css';
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

class DxfWindowContent extends React.Component {

    static propTypes = {
        urlConfigFile: PropTypes.string,
        urlDxfFile: PropTypes.string
    };

    constructor(props) {
        super(props);
        this.state = {
            config_file: {},
            dxf_file: null
        };
    }

    componentDidMount() {
        axios.get(this.props.urlConfigFile)
            .then(response => this.setState({config_file: response.data}));
    }

    render() {
        return (
            <div>
                <LoadingIndicator/>

                <Formik
                    enableReinitialize
                    initialValues={{
                        crs: this.state.config_file?.parameters?.geoserver?.crs,
                        dxf_file: ''
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        this.setState({
                            dxf_file: values.dxf_file,
                            config_file: {
                                ...this.state.config_file,
                                parameters: {
                                    ...this.state.config_file.parameters,
                                    geoserver: {
                                        ...this.state.config_file.parameters.geoserver,
                                        crs: values.crs
                                    }
                                }
                            }
                        });
                        axios.post(this.props.urlConfigFile, this.state.config_file)
                            .then(() => trackPromise(
                                fetch(this.props.urlDxfFile, {
                                    method: 'post', headers: new Headers({"Content-type": 'text/plain'}), body: this.state.dxf_file
                                })
                            ));
                        setSubmitting(false);
                    }}
                >
                    {(formProps) => (
                        <div>
                            <Form>
                                <div className="row-dxf">
                                    <div className="form-group-col">
                                        <label className="custom-file-upload">
                                            <input className="file-field" type="file" name="dxf_file" onChange={(event) => formProps.setFieldValue("dxf_file", event.target.files[0])}/>
                                        </label>
                                    </div>
                                </div>

                                <div className="row-dxf">
                                    <div className="form-group-col">
                                        <label className="crs-label" htmlFor="crs">CRS</label>
                                        <Field className="text-" name="crs" type="text"/>
                                    </div>
                                </div>

                                <div className="row-dxf">
                                    <div className="form-group-col">
                                        <button className="launch-button" type="submit">Upload</button>
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

export default DxfWindowContent;
