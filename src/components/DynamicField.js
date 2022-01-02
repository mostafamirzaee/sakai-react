import React from 'react';
import classNames from 'classnames';
import { FileUpload } from 'primereact/fileupload';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';

//Mostafa: this component works directly with from 'primereact/' UI components
export const DynamicField = ({field, values, touched, errors, handleBlur, handleChange, isFormFieldValid, getFormErrorMessage, crudService, toast}) => {

    const onUpload = () => {
        toast.current.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded' });
    }

    function renderInput(rcField, values, touched, errors, handleBlur, handleChange) {
        const propertyName = rcField.fieldPropertyName;
        const _classNames = classNames({ 'p-invalid': isFormFieldValid(touched, errors, "dynamicAttrsMap." + rcField.fieldPropertyName) });
        //props.formik.values.dynamicAttrsMap[propertyName] = ''; //Mostafa: adding the dynamic propery to formik.

        switch (rcField.fieldInputType) {
            case 1: //Text Field - String
                return <InputText id={"dynamicAttrsMap." + propertyName} name={"dynamicAttrsMap." + propertyName} value={values.dynamicAttrsMap[propertyName]} 
                onBlur={handleBlur} onChange={handleChange} className={_classNames}  />;
            case 2: //Text Field - Number
                return <InputText id={"dynamicAttrsMap." + propertyName} name={"dynamicAttrsMap." + propertyName} value={values.dynamicAttrsMap[propertyName]} 
                onBlur={handleBlur} onChange={handleChange} className={_classNames}  />;
            case 3: //Date
                return <Calendar showIcon id={"dynamicAttrsMap." + propertyName} name={"dynamicAttrsMap." + propertyName} value={values.dynamicAttrsMap[propertyName]} 
                onBlur={handleBlur} onChange={handleChange} className={_classNames}  />;
            case 4: //Date-Time
                return <Calendar showTime id={"dynamicAttrsMap." + propertyName} name={"dynamicAttrsMap." + propertyName} value={values.dynamicAttrsMap[propertyName]} 
                onBlur={handleBlur} onChange={handleChange} className={_classNames}  />;
            case 5: //Time
                return <Calendar timeOnly id={"dynamicAttrsMap." + propertyName} name={"dynamicAttrsMap." + propertyName} value={values.dynamicAttrsMap[propertyName]} 
                onBlur={handleBlur} onChange={handleChange} className={_classNames}  />;
            case 6: //List 
                return <Dropdown id={"dynamicAttrsMap." + propertyName} name={"dynamicAttrsMap." + propertyName} value={values.dynamicAttrsMap[propertyName]} 
                    onBlur={handleBlur} onChange={handleChange} options={rcField.fieldListValues} optionLabel="label" optionValue="id" className={_classNames}  />;
            case 7: //Attachment
                //TODO: file upload should be check with Sadra
                return <FileUpload name={"dynamicAttrsMap." + propertyName + "_attch"} url={crudService.getCurrentBackendServiceUrl() + "/uploadFile"} 
                    onBlur={handleBlur} onChange={handleChange} onUpload={onUpload} maxFileSize={1000000}
                    emptyTemplate={<p className="p-m-0">Drag and drop files to here to upload.</p>} className={_classNames}  />;
        }
    }

    return (
        <>
            <div className="field col-12 lg:col-6 md:col-6">
                <span className="p-float-label p-input-icon-right">
                    {renderInput(field, values, touched, errors, handleBlur, handleChange)}
                    <label htmlFor={"dynamicAttrsMap." + field.fieldPropertyName} className={classNames({'p-error': isFormFieldValid(touched, errors, "dynamicAttrsMap." + field.fieldPropertyName) })}>
                        {field.fieldLabel}{field.fieldMandatory && '*'}</label>
                </span>
                {getFormErrorMessage(touched, errors, "dynamicAttrsMap." + field.fieldPropertyName)}
            </div>

        </>
    )
}