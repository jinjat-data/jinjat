import React from "react";
import {
    ControlProps,
    isControl,
    isDescriptionHidden,
    JsonFormsRendererRegistryEntry,
    rankWith,
    resolveSchema,
    UISchemaElement,
} from "@jsonforms/core";
import {JsonSchema} from "@jsonforms/core/src/models";
import {Box, FormHelperText, InputLabel, Rating} from "@mui/material";
import {JinjatJsonSchema, OpenAPIParameter} from "@components/hooks/schema";
import {EditorCode} from "@components/code/editor-code";
import {materialCells, materialRenderers} from "@jsonforms/material-renderers";
import {withJsonFormsControlProps} from "@jsonforms/react";
import merge from "lodash/merge";
import {useFocus} from "@jsonforms/material-renderers";
import {Paper} from "@mui/material";

export interface JsonFormsProxy {
    Component: React.FC<any>;
}

const WrapperForJsonFormsComponent = (Component: React.ComponentType<any>) => {
    return (props: any) => (
        <WrappedJsonFormsComponent Component={Component} {...props} />
    );
};

const withJsonFormsComponent = (Component: React.ComponentType<any>) => {
    return WrapperForJsonFormsComponent(Component);
};

export const WrappedJsonFormsComponent = (
    props: ControlProps & JsonFormsProxy
) => {
    const [focused, onFocus, onBlur] = useFocus();

    const {
        uischema,
        data,
        label,
        visible,
        handleChange,
        config,
        errors,
        description,
        schema,
        path,
        renderers,
    } = props;
    const appliedUiSchemaOptions = merge({}, config, uischema.options);
    const isValid = errors.length === 0;

    const showDescription = !isDescriptionHidden(
        visible,
        description,
        focused,
        appliedUiSchemaOptions.showUnfocusedDescription
    );

    const firstFormHelperText = showDescription
        ? description
        : !isValid
            ? errors
            : null;
    const secondFormHelperText = showDescription && !isValid ? errors : null;

    const onChange = function (value: any) {
        return handleChange(path, value);
    };

    return (
        <Paper sx={{display: !visible ? 'hidden' : 'block'}}>
            <InputLabel shrink={true} size={'normal'}>{label}</InputLabel>
            <props.Component value={data} onChange={onChange}/>
            <FormHelperText error={!isValid && !showDescription}>
                {firstFormHelperText}
            </FormHelperText>
            <FormHelperText error={!isValid}>{secondFormHelperText}</FormHelperText>
        </Paper>
    );
};

export const customModules = [
    {
        component: Rating,
        name: "rating",
    },
    {
        component: EditorCode,
        name: 'code'
    }
];

export const extractJsonSchemaFromOpenAPIParameters = (
    parameters: OpenAPIParameter[]
): JsonSchema | null => {
    if (parameters.length == 0) {
        return null;
    }
    const properties: {
        [key: string]: JsonSchema
    } = {};

    const requiredFields: string[] = [];
    parameters.forEach((parameter) => {
        if (parameter.schema) {
            if (parameter.required) {
                requiredFields.push(parameter.name);
            }
            parameter.schema.description =
                parameter.schema.description || parameter.description;
            properties[parameter.name] = parameter.schema;
        } else {
            properties[parameter.name] = {
                type: "string",
            };
        }
    });

    return {
        type: "object",
        required: requiredFields,
        properties,
    } as JsonSchema;
};

const jinjatMaterialRenderers = materialRenderers.map((it) => ({
    tester: it.tester,
    renderer: (args: any) => {
        return args.enabled != false && (
            <Box
                sx={{display: "flex", flexDirection: "column"}}
                style={{marginTop: "10px"}}
            >
                <it.renderer {...args} />
            </Box>
        );
    },
}));

export const customJsonFormsRenderers = customModules.map((module) => {
    const newVar: JsonFormsRendererRegistryEntry = {
        tester: rankWith(
            3,
            (uischema: UISchemaElement, schema: JsonSchema, context): boolean => {
                if (!isControl(uischema)) {
                    return false;
                }

                const b: JinjatJsonSchema = resolveSchema(
                    schema,
                    uischema.scope,
                    context?.rootSchema
                );
                const renderer = b?.["x-jsonforms"]?.renderer;
                return renderer == module.name;
            }
        ),
        renderer: withJsonFormsControlProps(withJsonFormsComponent(module.component)),
    };
    return newVar;
});

export const allJsonFormsRenderer = [
    ...jinjatMaterialRenderers,
    ...customJsonFormsRenderers,
];

export const allJsonFormsCells = [...materialCells];
