import {useRouter} from 'next/router';
import React, {useState} from 'react';
import {JinjatForm, JinjatJsonFormsInitStateProps} from './JinjatForm';
import {ParsedUrlQuery} from 'querystring';

type JinjatUrlParamsFormProps<T> = Omit<JinjatJsonFormsInitStateProps<T>, 'data'>;

const JinjatQueryParamsForm: React.FC<JinjatUrlParamsFormProps<ParsedUrlQuery>> = (params) => {
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

export default JinjatQueryParamsForm;
