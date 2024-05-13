import React from "react";
import {OpenAPIParameter} from '@components/hooks/schema';
import {Button, Card, CardActions, CardContent, Typography} from "@mui/material";
import {extractJsonSchemaFromOpenAPIParameters} from "./util";
import {JinjatForm} from "./JinjatForm";
import { stringify } from "query-string";
import {useParams, useSearchParams} from "next/navigation";
import {useRouter} from "next/router";

export interface JinjatAnalysisFormProps {
    parameters: OpenAPIParameter[];
    action : string;
}

const getPathParams = function (pathsList: any[]) {
    const paths : any = {}
    if(!Array.isArray(pathsList)) {
        pathsList = [pathsList]
    }

    pathsList.forEach(path => {
        const [key, value] = path.split(':', 2)
        paths[key] = value
    })
    return paths
}

const JinjatAnalysisForm: React.FC<JinjatAnalysisFormProps> = ({parameters, action : actionFromProps}) => {
    const router = useRouter();
    const searchParams = useSearchParams()

    const params = useParams();
    const resource_type = Object.keys(params)[0];

    const queryResult = router.query[resource_type];
    const response : string[] = !Array.isArray(queryResult) ? [queryResult as string] : queryResult as string[]
    const [package_name, version, name, action, ...pathsList] = response

    const queryParamsSchema = React.useMemo(() => {
        return extractJsonSchemaFromOpenAPIParameters(parameters.filter(param => param.in == "query"));
    }, [parameters]);

    const pathParamsSchema = React.useMemo(() => {
        return extractJsonSchemaFromOpenAPIParameters(parameters.filter(param => param.in == "path"));
    }, [parameters]);

    const initialQueryParams = Object.fromEntries(searchParams.entries());
    const [queryParams, setQueryParams] = React.useState(initialQueryParams)
    const [pathParams, setPathParams] = React.useState(getPathParams(pathsList))

    function redirectPage() {
        const pathParamsSerialized = Object.keys(pathParams).map(key => `${key}:${pathParams[key]}`).join('/');
        const queryParamsSerialized = stringify(queryParams)
        const newUrl = `/${resource_type}/${package_name}/${version}/${name}/${action || actionFromProps}/${pathParamsSerialized}${queryParamsSerialized}`;
        router.push(newUrl)
    }

    return (
        <Card variant={'elevation'} sx={{backgroundColor :'neutral.50'}}>
            <CardContent>
                {queryParamsSchema != null ? <div>
                    <Typography variant="subtitle2" style={{opacity: '0.3'}}>
                        query parameters
                    </Typography>
                    <JinjatForm data={queryParams} schema={queryParamsSchema} layout={'horizontal'} onChange={setQueryParams} />
                </div> : null}

                {pathParamsSchema != null ? <div>
                    <Typography variant="subtitle2" style={{opacity: '0.3'}}>
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
