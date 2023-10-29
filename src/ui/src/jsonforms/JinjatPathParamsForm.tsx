import {useRouter} from 'next/router';
import React, {useState} from 'react';
import {JinjatForm, JinjatJsonFormsInitStateProps} from './JinjatForm';
import {ParsedUrlQuery} from 'querystring';
import {OpenAPIParameter} from '@components/hooks/schema';
import {JsonSchema} from '@jsonforms/core';


type JinjatPathParamsFormProps<T> = Omit<JinjatJsonFormsInitStateProps<T>, 'data'>;

const JinjatPathParamsForm: React.FC<JinjatPathParamsFormProps<ParsedUrlQuery>> = (params) => {
    const router = useRouter();


    const paths= React.useState(() => {
        let [package_name, version, name, action, ...pathsList] = router.query[Object.keys(router.query)[0]]

        const paths = {}
        if(!Array.isArray(pathsList)) {
            pathsList = [pathsList]
        }

        pathsList.forEach(path => {
            let [key, value] = path.split(':', 2)
            paths[key] = value
        })
        return paths
    }, [router.query])


    const handleFormChange = (updatedData: ParsedUrlQuery) => {
        params?.onChange?.(updatedData)
    };

    return (
        <JinjatForm data={paths} onChange={handleFormChange} {...params} />
    );
};

export default JinjatPathParamsForm;
