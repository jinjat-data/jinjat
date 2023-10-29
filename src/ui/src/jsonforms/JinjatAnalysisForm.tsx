import React from 'react';
import {OpenAPIParameter} from '@components/hooks/schema';
import {Box, Button, Card, CardActions, CardContent, CardHeader, Typography} from "@mui/material";
import {extractJsonSchemaFromOpenAPIParameters} from "./util";
import {useRouter} from "next/router";
import {JinjatForm} from "./JinjatForm";
import { stringify } from "query-string";

export interface JinjatAnalysisFormProps {
    parameters: OpenAPIParameter[];
    action : string;
}

const getPathParams = function (pathsList) {
    const paths = {}
    if(!Array.isArray(pathsList)) {
        pathsList = [pathsList]
    }

    pathsList.forEach(path => {
        let [key, value] = path.split(':', 2)
        paths[key] = value
    })
    return paths
}

const JinjatAnalysisForm: React.FC<JinjatAnalysisFormProps> = ({parameters, action : actionFromProps}) => {
    const router = useRouter();

    let resource_type = Object.keys(router.query)[0];
    let [package_name, version, name, action, ...pathsList] = router.query[resource_type]

    let queryParamsSchema = React.useMemo(() => {
        return extractJsonSchemaFromOpenAPIParameters(parameters.filter(param => param.in == "query"));
    }, [parameters]);

    let pathParamsSchema = React.useMemo(() => {
        return extractJsonSchemaFromOpenAPIParameters(parameters.filter(param => param.in == "path"));
    }, [parameters]);

    const [queryParams, setQueryParams] = React.useState(null)
    const [pathParams, setPathParams] = React.useState(getPathParams(pathsList))

    function redirectPage() {
        let pathParamsSerialized = Object.keys(pathParams).map(key => `${key}:${pathParams[key]}`).join('/');
        let queryParamsSerialized = stringify(queryParams)
        router.push(`/${resource_type}/${package_name}/${version}/${name}/${action || actionFromProps}/${pathParamsSerialized}${queryParamsSerialized}`)
    }

    return (
        <Card variant={'elevation'}>
            <CardContent>
                {queryParamsSchema != null ? <div>
                    <Typography variant="h5" ml={5} mt={0}>
                        query parameters
                    </Typography>
                    <JinjatForm data={queryParams} schema={queryParamsSchema} layout={'horizontal'} onChange={setQueryParams} />
                </div> : null}

                {pathParamsSchema != null ? <div>
                    <Typography variant="h6">
                        path parameters
                    </Typography>
                    <JinjatForm data={pathParams} schema={pathParamsSchema} layout={'horizontal'} onChange={setPathParams}/>
                </div> : null}
            </CardContent>

            <CardActions>
                <Button size="small" disabled={queryParams == pathParams == null} onClick={redirectPage}>Update</Button>
            </CardActions>
        </Card>
    );
};

export default JinjatAnalysisForm;
