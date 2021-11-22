import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { CalendarService } from '../service/CalendarService';
import { Checkbox } from 'primereact/checkbox';
import { useFormik } from 'formik';
import { Calendar } from 'primereact/calendar';
import './FormDemo.css';

export const CalendarCrud = () => {

    let emptyCalendar = {
        id: null,
        date: null,
        idHoliday: false,
        description: '',
    };

    const [calendars, setCalendars] = useState([]);
    const [calendarDialog, setCalendarDialog] = useState(false);
    const [deleteCalendarDialog, setDeleteCalendarDialog] = useState(false);
    const [deleteCalendarsDialog, setDeleteCalendarsDialog] = useState(false);
    const [calendar, setCalendar] = useState(emptyCalendar);
    const [selectedCalendars, setSelectedCalendars] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    const toast = useRef(null);
    const dt = useRef(null);

    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectedRepresentative, setSelectedRepresentative] = useState(null);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 31,
        page: 0,
        sortField: 'date',
        sortOrder: 1, 
        filters: {
            'startDate': { value: '', matchMode: 'contains' },
            'endDate': { value: '', matchMode: 'contains' },
            'idHoliday': { value: '', matchMode: 'contains' },
            'description': { value: '', matchMode: 'contains' },
        }
    });
    const [holidayOtions, setHolidayOtions] = useState([]);    
    let loadLazyTimeout = null;
    let inputsAreValid = false;
    const calendarService = new CalendarService();

    const [dateRange, setDateRange] = useState('');

    useEffect(() => {
        loadLazyData();
    },[lazyParams]);

    //Mostafa: Initialize the states such as combo-box options here.
    useEffect(() => {
        //Mostafa: Initializing profile options.
        calendarService.getHolidayOptions().then(
            data => {setHolidayOtions(data);
            console.log(data)});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadLazyData = () => {
        setLoading(true);

        if (loadLazyTimeout) {
            clearTimeout(loadLazyTimeout);
        }

        //imitate delay of a backend call
        loadLazyTimeout = setTimeout(() => {
            calendarService.getCalendarsWithFiltersAndSort(lazyParams)
                .then(data => {
                    setTotalRecords(data.totalItems);
                    setCalendars(data.objects);
                    setLoading(false);
                });
        }, Math.random() * 1000 + 250);
    }

    const [showMessage, setShowMessage] = useState(false);
    const formik = useFormik({
        initialValues: calendar || emptyCalendar, //Mostafa: edit or new: if calendar state is avaialble then use it otherwise use emptyCalendar.
        enableReinitialize : true, //Mostafa: needed to load object for Edit.
        validate: (data) => {
            let errors = {};

            if (!data.date) {
                errors.date = 'Date is required.';
            }

            if (data.isHoliday == null) { //Mostafa: Checkbox if not checked is false, but it is not null and valid to go.
                errors.isHoliday = 'is-Holiday is required.';
            }

            return errors;
        },
        onSubmit: (data) => {
            saveCalendar(data);
        }
    });
    const isFormFieldValid = (name) => !!(formik.touched[name] && formik.errors[name]);
    const getFormErrorMessage = (name) => {
        return isFormFieldValid(name) && <small className="p-error">{formik.errors[name]}</small>;
    };

    const goToLastPageIfNeeded = (newNumberOfObjectsInPage) => {
        let _lazyParams = { ...lazyParams};
        let newPage = 0; //0 just for initialization.
        let newPageCount = 0; //0 just for initialization.
        let newFirst = 0; //0 just for initialization.
        let LazyParamsNeedUpdate = false;
        let newRows = 1; //for now only 1 new onject is added via create dialog.

        if (newNumberOfObjectsInPage === 0){ //Mostafa: this happens if the operation is deletion;
            LazyParamsNeedUpdate = true;
            newPageCount = --_lazyParams.pageCount; //Mostafa: PageCount is not updated correctly after useEffect, so I guess I should manually correct it;
            newPage = _lazyParams.pageCount > 0 ? newPageCount - 1 : 0;  //Mostafa: if page index is > 0 reduce by 1 otherwise return 0;
        }
        else if (newNumberOfObjectsInPage >  _lazyParams.rows){ //Mostafa: this happens if the operation is addition;
            LazyParamsNeedUpdate = true;

            newPageCount = Math.ceil((totalRecords+newRows) / _lazyParams.rows);
            newPage = newPageCount -1; //since page index starts from 0;

            // newPage = _lazyParams.pageCount; //Mostafa: as page index starts with 0, so page count would be new page index in this case;
            // newPageCount = ++_lazyParams.pageCount; //Mostafa: PageCount is not updated correctly after useEffect, so I guess I should manually correct it;
        }
        else{
            LazyParamsNeedUpdate = false;
        }

        if(LazyParamsNeedUpdate){
            //Mostafa: Setting Lazy Params
            _lazyParams.page = newPage;
            _lazyParams.pageCount = newPageCount
            newFirst = ((newPage) * _lazyParams.rows);
            _lazyParams.first = newFirst;
            _lazyParams.sortField = 'id'; //Mostafa: to show the newly created item at the end of the list.
            _lazyParams.sortOrder = 1; //Mostafa: to show the newly created item at the end of the list.

            setLazyParams(_lazyParams);
        }
    }

    const onPage = (event) => {
        let _lazyParams = { ...lazyParams, ...event };
        setLazyParams(_lazyParams);
    }

    const onSort = (event) => {
        let _lazyParams = { ...lazyParams, ...event };

        //Mostafa: both onSort and onFilter should go to first page:
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;

        setLazyParams(_lazyParams);
    }

    const onFilter = (event) => {
        let _lazyParams = { ...lazyParams, ...event };

        //Mostafa: both onSort and onFilter should go to first page:
        _lazyParams['first'] = 0;
        _lazyParams['page'] = 0;

        setLazyParams(_lazyParams);
    }

    const formatCurrency = (value) => {
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }

    const openNew = () => {
        setCalendar(emptyCalendar);
        setSubmitted(false);
        setCalendarDialog(true);
    }

    const hideDialog = () => {

        setSubmitted(false);

        formik.resetForm();
        setCalendar(emptyCalendar);
        setShowMessage(false);
        
        setCalendarDialog(false);
    }

    const hideDeleteCalendarDialog = () => {
        setDeleteCalendarDialog(false);
    }

    const hideDeleteCalendarsDialog = () => {
        setDeleteCalendarsDialog(false);
    }

    const saveCalendar = (_calendar) => {
        setSubmitted(true);

        //let _calendar = { ...calendar }; /* Mostafa: [...] here to copy the object */
        if (calendar.id) {
            //mostafa: call service put method to update the calendar.
            calendarService.putCalendar(_calendar, updateResponseCallback);
        }
        else {

            //mostafa: call service post method to create the calendar.
            calendarService.postCalendar(_calendar, createResponseCallback);
        }
    }

    const updateResponseCallback = (_calendar, res, success, message) => {
        if (success){
            let _calendars = [...calendars]; {/* Mostafa: [...] here to copy array */}
            const index = findIndexById(calendar.id);
            _calendars[index] = _calendar;
            
            setCalendars(_calendars);
            setCalendar(emptyCalendar);
            setCalendarDialog(false);
            setShowMessage(true);
            formik.resetForm();

            toast.current.show({ severity: 'success', summary: 'Successful', detail: message, life: 5000 }); //Calendar Updated
        }
        else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 10000 });
        }
    }

    const createResponseCallback = (_calendar, res, success, message) => {
        if (success){
            let _calendars = [...calendars]; {/* Mostafa: [...] here to copy array */}
            _calendar.id = res.data.object.id;
            _calendars.push(_calendar);
            
            setCalendars(_calendars);

            setCalendarDialog(false);
            setCalendar(emptyCalendar);
            setShowMessage(true);
            formik.resetForm();


            goToLastPageIfNeeded(_calendars.length); //Mostafa: The lazy mode in DataTable component doesn't handle going automatically to next page after page is full I guess; at least so far as I searched. I hope I am not stupid;

            let newCreatedObjects = 1;
            updateTotalRecords(newCreatedObjects);

            toast.current.show({ severity: 'success', summary: 'Successful', detail: message, life: 5000 }); //Calendar Created

        }
        else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 10000 });
        }
    }

    const updateTotalRecords = (_by) => {
        let _newTotalRecord = totalRecords + _by;
        setTotalRecords(_newTotalRecord);
    }

    const editCalendar = (calendar) => {
        setCalendar({ ...calendar });
        setCalendarDialog(true);
    }

    const confirmDeleteCalendar = (calendar) => {
        setCalendar(calendar);
        setDeleteCalendarDialog(true);
    }

    const deleteCalendar = () => {
        let _calendar = { ...calendar }; /* Mostafa: [...] here to copy the object */
        setDeleteCalendarDialog(false);
        calendarService.deleteCalendar(_calendar, deleteResponseCallback);
    }

    const deleteResponseCallback = (_calendar, res, success, message) => {
        if (success){
            let _calendars = calendars.filter(val => val.id !== calendar.id);

            setCalendars(_calendars);
            setCalendar(emptyCalendar);
            goToLastPageIfNeeded(_calendars.length); //Mostafa: The lazy mode in DataTable component doesn't handle going automatically to previous page if the page is empty I guess; at least so far as I searched. I hope I am not stupid;
            let _updateBy = -1; //-1 for created - > means 1 deleted.
            updateTotalRecords(_updateBy);

            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Calendar Deleted', life: 3000 });
            }
        else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 10000 });
        }
    }

    const deleteSelectedCalendars = () => {

        let _selectedCalendars = { ...selectedCalendars }; /* Mostafa: [...] here to copy the object */
        setDeleteCalendarsDialog(false);
        calendarService.deleteCalendars(_selectedCalendars, deleteMultipleResponseCallback);

    }

    const deleteMultipleResponseCallback = (_selectedCalendars, res, success, message) => {
        if (success){
            let _calendars = calendars.filter(val => !selectedCalendars.includes(val));
            setCalendars(_calendars);

            let _updateBy = -1 * selectedCalendars.length; //to update totalRecords
            updateTotalRecords(_updateBy);

            setSelectedCalendars(null);

            goToLastPageIfNeeded(_calendars.length); //Mostafa: The lazy mode in DataTable component doesn't handle going automatically to previous page if the page is empty I guess; at least so far as I searched. I hope I am not stupid;

            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Calendars Deleted', life: 3000 });
        }
        else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 10000 });
        }
    }

    const findIndexById = (id) => {
        let index = -1;
        for (let i = 0; i < calendars.length; i++) {
            if (calendars[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    const createId = () => {
        let id = '';
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const confirmDeleteSelected = () => {
        setDeleteCalendarsDialog(true);
    }

    const onCategoryChange = (e) => {
        let _calendar = { ...calendar };
        _calendar['category'] = e.value;
        setCalendar(_calendar);
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _calendar = { ...calendar };
        _calendar[`${name}`] = val;

        setCalendar(_calendar);
    }

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _calendar = { ...calendar };
        _calendar[`${name}`] = val;

        setCalendar(_calendar);
    }

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} disabled={!selectedCalendars || !selectedCalendars.length} />
                </div>
            </React.Fragment>
        )
    }

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                {/*Mostafa: no import at the moment.
                <FileUpload mode="basic" accept="image/*" maxFileSize={1000000} label="Import" chooseLabel="Import" className="mr-2 inline-block" />
                */}
                <Button label="Export" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />
            </React.Fragment>
        )
    }

    const dateBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Date</span>
                {rowData.date}
            </>
        );
    }

    const isHolidayBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">IsHoliday</span>
                {/*Mostafa: This how to display the actual value {`${rowData.isHoliday}`}*/}
                {rowData.isHoliday?'Yes':'No'}
            </>
        );
    }

    const descriptionBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Description</span>
                {rowData.description}
            </>
        );
    }

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="actions">
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-success mr-2" onClick={() => editCalendar(rowData)} />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={() => confirmDeleteCalendar(rowData)} />
            </div>
        );
    }


    const onApplyDateRange = () => {

        if(dateRange && dateRange.length == 2){
            let _lazyParams = { ...lazyParams};

            _lazyParams.filters.startDate.value = dateRange[0];
            _lazyParams.filters.endDate.value = dateRange[1];

            setLazyParams(_lazyParams);
        }
    }

    const header = (
        <>
            <div className="card">
                <h5>Manage Calendar</h5>
                <div class="d-flex justify-content-start">

                    <div className="grid">
                        <div className="col-12 md:col-6">
                                <h6>Date Range</h6>
                                <Calendar inputId="dateRange" value={dateRange} selectionMode="range" className="mr-2 mb-2" onChange={(e) => setDateRange(e.value)} showIcon/>
                                <Button label="Apply Date Range" icon="pi pi-filter" className="mr-2 mb-2" onClick={onApplyDateRange} />
                        </div>                
                    </div>

                </div>
                {/* Mostafa: we do not provide global search as of now. 
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." />
                */}

            </div>
        </>
    );

    const deleteCalendarDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteCalendarDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteCalendar} />
        </>
    );
    const deleteCalendarsDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteCalendarsDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteSelectedCalendars} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

                    {/*Mostafa: lazy="true" to grab the control of pagination, as it shows only received page as totalRecrods by default. */}
                    <DataTable lazy="true" ref={dt} value={calendars} selection={selectedCalendars} onSelectionChange={(e) => setSelectedCalendars(e.value)}
                        dataKey="id" paginator rows={lazyParams.rows} first={lazyParams.first} totalRecords={totalRecords} rowsPerPageOptions={[7, 31]} className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} calendars"
                        globalFilter={globalFilter} emptyMessage="No calendars found." header={header} onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        onFilter={onFilter} filters={lazyParams.filters} loading={loading}>

                        <Column selectionMode="multiple" headerStyle={{ width: '2%' }}></Column>
                        <Column field="date" header="Date" sortable body={dateBodyTemplate} headerStyle={{ width: '12%' }} > </Column>
                        <Column field="isHoliday" header="Is-Holiday" sortable body={isHolidayBodyTemplate} headerStyle={{ width: '11%' }} filterField="isHoliday" filter filterPlaceholder="<Is-Holiday>"></Column>
                        <Column field="description" header="Description" sortable body={descriptionBodyTemplate} headerStyle={{ width: '10%' } } filterField="description" filter filterPlaceholder="<Description>"></Column>
                        <Column header="Actions" headerStyle={{ width: '8%' }} body={actionBodyTemplate}></Column>
                    </DataTable>
                    <div className="form-demo">
                        <div className="p-d-flex p-jc-center">
                            <Dialog visible={calendarDialog} style={{ width: '450px' }} header="Calendar Details" modal className="p-fluid" /*footer={calendarDialogFooter}*/ onHide={hideDialog}>
                                <div className="card">
                                    <form onSubmit={formik.handleSubmit} className="p-fluid">
                                        <div className="field">
                                            <span className="p-float-label">
                                                <InputText id="date" name="date" value={formik.values.date} onChange={formik.handleChange} autoFocus className={classNames({ 'p-invalid': isFormFieldValid('date') })} />
                                                <label htmlFor="date" className={classNames({ 'p-error': isFormFieldValid('date') })}>Date*</label>
                                            </span>
                                            {getFormErrorMessage('date')}
                                        </div>
                                        <div className="field-checkbox">
                                            <Checkbox inputId="isHoliday" name="isHoliday" checked={formik.values.isHoliday} onChange={formik.handleChange} className={classNames({ 'p-invalid': isFormFieldValid('isHoliday') })} />
                                            <label htmlFor="isHoliday" className={classNames({ 'p-error': isFormFieldValid('isHoliday') })}>Is-Holiday*</label>
                                            {getFormErrorMessage('isHoliday')}
                                        </div>
                                        <div className="field">
                                            <span className="p-float-label">
                                                <InputText id="description" name="description" value={formik.values.description} onChange={formik.handleChange} className={classNames({ 'p-invalid': isFormFieldValid('description') })} />
                                                <label htmlFor="description" className={classNames({ 'p-error': isFormFieldValid('description') })}>Description</label>
                                            </span>
                                        </div>
                                        
                                        <div className="p-dialog-footer">
                                            <Button type="button" label="Cancel" icon="pi pi-times" className="p-button p-component p-button-text" onClick={hideDialog} />
                                            <Button type="submit" label="Save" icon="pi pi-check" className="p-button p-component p-button-text" />
                                        </div>
                                    </form>
                                </div>
                            </Dialog>
                        </div>
                        <Dialog visible={deleteCalendarDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteCalendarDialogFooter} onHide={hideDeleteCalendarDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {calendar && <span>Are you sure you want to delete <b>{calendar.name}</b>?</span>}
                            </div>
                        </Dialog>

                        <Dialog visible={deleteCalendarsDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteCalendarsDialogFooter} onHide={hideDeleteCalendarsDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {calendar && <span>Are you sure you want to delete the selected calendars?</span>}
                            </div>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    );
}
