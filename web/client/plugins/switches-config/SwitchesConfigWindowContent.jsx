/* eslint-disable react/prop-types */
import React from 'react';
import { Formik, Field, Form, FieldArray } from 'formik';
import './switchesConfig.css';
import axios from 'axios';

class SwitchesWindowContent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            type: '',
            content: [{
                'cabin': '',
                'switches': []
            }]
        };

        axios.get(this.props.urlSwitchesConfigFile)
            .then(response => {
                this.state.type = response.data.type;
                this.state.content = response.data.content;
            });
    }

    render() {
        return (
            <Formik
                enableReinitialize
                initialValues={{
                    content: this.props.content
                }}
                onSubmit={(values, {setSubmitting }) => {
                    this.setState({
                        ...this.state,
                        content: values?.content
                    });
                    axios.post(this.props.urlSwitchesConfigFile, this.state);
                    setSubmitting(false);
                }}
            >
                {({values}) => (
                    <div>
                        {!(values?.content?.length > 0) && (
                            <div>No switches to configure. Import a dxf file first.</div>
                        )}
                        {values?.content?.length > 0 && (
                            <Form>
                                <div>
                                    <FieldArray
                                        name = "cabins"
                                        render = {() => (
                                            <div className="cabin-name">
                                                {values?.content.map( (cab, ind) => (
                                                    <div>
                                                        <h3>{cab.cabin}</h3>
                                                        {cab?.switches.map((sw, index) => (
                                                            <div>
                                                                <label className="form-check-label">
                                                                    <Field className="check-field" type="checkbox" name={`content.${ind}.switches.${index}.status`} />
                                                                    zone {sw.zone}
                                                                </label>
                                                            </div>
                                                        ))}
                                                        <hr></hr>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    />
                                </div>
                                <div className="row-switch">
                                    <div className="form-group-col">
                                        <button className="launch-button" type="submit">Save</button>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </div>
                )}
            </Formik>
        );
    }
}

export default SwitchesWindowContent;
