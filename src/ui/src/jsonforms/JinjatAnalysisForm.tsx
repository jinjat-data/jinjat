import React from 'react';
import {JsonForms} from '@jsonforms/react';
import {createMuiTheme} from '@material-ui/core';
import {ThemeProvider} from '@material-ui/styles';
import {OpenAPIV3} from 'openapi-types';
import {OpenAPIParameter} from '@components/hooks/schema';
import {JinjatForm, JinjatJsonFormsInitStateProps} from './JinjatForm';
import {UISchemaElement} from '@jsonforms/core';
import JinjatUrlParamsForm, {extractJsonSchemaFromOpenAPIParameters} from "./JInjatUrlParamsForm";
import {ParsedUrlQuery} from "querystring";
import _ from "lodash";
import {Box, Button, Card, CardActions, CardContent, CardHeader, Typography} from "@mui/material";

type testing = { query: ParsedUrlQuery, 'path', 'header', 'cookie' };

export interface JinjatAnalysisFormProps {
    parameters: OpenAPIParameter[];
}

const JinjatAnalysisForm: React.FC<JinjatAnalysisFormProps> = ({parameters}) => {

    let groupedParams = _.groupBy(parameters, param => param.in);
    const uniqueParams = Object.keys(groupedParams)
    const categories = uniqueParams.map(param => {
        return groupedParams[param].map(paramVal => {
            return {
                "type": "Control",
                "scope": `#/properties/${param}/properties/${paramVal.name}`
            }
        });
    })

    const properties = uniqueParams.reduce((acc, inValue) => {
        acc[inValue] = extractJsonSchemaFromOpenAPIParameters(groupedParams[inValue]);
        return acc;
    }, {});

    return (
        <Box>
            <Card variant="outlined">
                <Typography variant="h5" ml={5} mt={0}>
                    in
                </Typography>
                <CardContent>
                    <JinjatForm data={{}} schema={properties['path']}/>
                </CardContent>
                <CardActions>
                    <Button size="small">Learn More</Button>
                </CardActions>
            </Card>
            <Card variant="outlined">
                <Typography variant="h5">
                    in
                </Typography>
                <CardContent>
                    <JinjatUrlParamsForm schema={properties['query']}/>
                </CardContent>
                <CardActions>
                    <Button size="small">Learn More</Button>
                </CardActions>
            </Card>
        </Box>
    );
};

export default JinjatAnalysisForm;
