import {useRouter} from 'next/router';
import {SetStateAction, useState} from 'react';
import {JinjatForm, JinjatJsonFormsInitStateProps} from './JinjatForm';
import {ParsedUrlQuery} from 'querystring';
import {OpenAPIParameter} from '@components/hooks/schema';
import {JsonSchema} from '@jsonforms/core';

export const extractJsonSchemaFromOpenAPIParameters = (
    parameters: OpenAPIParameter[]
): JsonSchema => {
    const properties: { [key: string]: JsonSchema } = {};

    const requiredFields : string[] = []
    parameters
        .forEach((parameter) => {
            if (parameter.schema) {
                if (parameter.required) {
                    requiredFields.push(parameter.name)
                }
                parameter.schema.description = parameter.schema.description || parameter.description
                properties[parameter.name] = parameter.schema;
            } else {
                properties[parameter.name] = {
                    type: 'string',
                };
            }
        });

    return {
        type: 'object',
        required: requiredFields,
        properties,
    } as JsonSchema;
};

type JinjatUrlParamsFormProps<T> = Omit<JinjatJsonFormsInitStateProps<T>, 'data'>;

const JinjatUrlParamsForm: React.FC<JinjatUrlParamsFormProps<ParsedUrlQuery>> = (params) => {
    const router = useRouter();
    const [formData, setFormData] = useState<ParsedUrlQuery>(router.query);

    const handleFormChange = (updatedData: ParsedUrlQuery) => {
        setFormData(updatedData);
        router.push({
            pathname: router.pathname,
            query: updatedData
        });
    };

    return (
        <JinjatForm data={formData} onChange={handleFormChange} {...params} />
    );
};

export default JinjatUrlParamsForm;
