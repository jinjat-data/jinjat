import { HorizontalLayout } from "@jsonforms/core/src/models/uischema";
import { ControlElement } from "@jsonforms/core";
import { JinjatCreate } from "@components/refine/create";
import { JinjatFormProps } from "@components/refine/utils";
import { JinjatEdit } from "@components/refine/edit";
import { JinjatList } from "@components/refine/list";
import { JinjatForm } from "../../jsonforms/JinjatForm";

export const Form = {
    render: (props: JinjatFormProps) => {
        const uiSchema: HorizontalLayout = {
            type: "HorizontalLayout",
            elements: [],
        };

        node.children
            .forEach((item: Node) => {
                if (item.tag === "control") {
                    uiSchema.elements.push({
                        type: "Control",
                        scope: item.attributes.ref,
                    } as ControlElement);
                    item.attributes.ref = item.attributes.label;
                } else if (item.tag === "if") {
                    const firstAnnotation = item.annotations[0];

                    if (
                        item.annotations.length != 1 ||
                        (firstAnnotation.constructor.name != "Function2" &&
                            firstAnnotation.type != "attribute" &&
                            firstAnnotation.value.parameters[0].name !=
                                "matches")
                    ) {
                        throw new Error(
                            "Invalid if tag. You can only use `matches` function",
                        );
                    }

                    const parameters = firstAnnotation.value.parameters;

                    item.children.forEach((child) => {
                        if (child.tag === "control") {
                            uiSchema.elements.push({
                                type: "Control",
                                scope: child.attributes.ref,
                                rule: {
                                    effect: "SHOW",
                                    condition: {
                                        scope: parameters[0],
                                        schema: parameters[1],
                                    },
                                },
                            } as ControlElement);
                        } else {
                            debugger;
                            throw new Error(
                                "Invalid tag in if. Only control is allowed.",
                            );
                        }
                    });
                } else {
                    debugger;
                    throw new Error(
                        "Invalid tag in form. Only control and if are allowed.",
                    );
                }
            });

        const attributes = {
            packageName: "snowflake_admin",
            resources: { create: "_create_file_format" },
        } as JinjatFormProps;

        return <JinjatForm />
    },
    attributes: {
        resources: { type: "string" },
    },
};

export const List = {
    render: JinjatList,
    attributes: {
        resources: { type: Object },
    },
};
