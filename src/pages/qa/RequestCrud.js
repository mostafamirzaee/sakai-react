import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Dialog } from 'primereact/dialog';
import { CrudService } from '../../service/CrudService';
import { Dropdown } from 'primereact/dropdown';
import { Formik, getIn } from 'formik';
import '../FormDemo.css';
import { DynamicField } from '../../components/DynamicField';
import { InputTextarea } from 'primereact/inputtextarea';

export const RequestCrud = () => {

    
    var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    //Mostafa: TODO: check last slice.
    var localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

    let emptyRequest = {
        id: null,

        categoryId: '',
        categoryName: '',

        requestDate: localISOTime,
        plannedDate: '',
        expiryDate: '',

        requesterUserId: '',
        requesterUserName: '',

        siteId: '',
        siteName: '',

        siteTypeName: '',
        siteTypeId: '',

        siteLatitude: '',
        siteLongitude: '',

        cityId: '',
        cityName: '',

        regionId: '',
        regionName: '',

        provinceId: '',
        provinceName: '',

        vendorId: '',
        vendorName: '',

        statusId: 1001, //the default hard-coded status id for Draft.
        statusName: 'Draft',

        comment: '',

        //Mostafa: Dynamic defning of objects, causes the warding of changing uncrontrolled to controlled in React, but what can I do?! it's actually dynamic and we cannot define them in code.
        dynamicAttrsMap: {} //an object which contains dynamic attributes.
    };

    const [requests, setRequests] = useState([]);
    const [requestDialog, setRequestDialog] = useState(false);
    const [deleteRequestDialog, setDeleteRequestDialog] = useState(false);
    const [deleteRequestsDialog, setDeleteRequestsDialog] = useState(false);
    const [request, setRequest] = useState(emptyRequest);
    const [selectedRequests, setSelectedRequests] = useState(null);
    const [globalFilter] = useState(null);
    const toast = useRef(null);
    const dt = useRef(null);

    //Mostafa: Combo box options which are dependent as a waterfall 
    const [sites, setSites] = useState([]);
    const [requestCategories, setRequestCategories] = useState([]);

    const [filterRequestCategoryFields, setFilterRequestCategoryFields] = useState([]); //Depending on selected request category, it loads related fields in this state.
    const [requestCategoryFields, setRequestCategoryFields] = useState([]); //Depending on selected request category, it loads related fields in this state.

    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
        detailsNeeded: false, //as default we want no details
        sortField: 'requestDate',
        sortOrder: 2,
        filters: {
            'categoryId': { value: '', matchMode: 'equals' },
            'categoryName': { value: '', matchMode: 'contains' },

            'requestDate': { value: '', matchMode: 'equals' }, //Mostafa: matchMode is just ignored here as it is specified in SearchModel for backend.
            'plannedDate': { value: '', matchMode: 'equals' }, //Mostafa: matchMode is just ignored here as it is specified in SearchModel for backend.
            'expiryDate': { value: '', matchMode: 'equals' }, //Mostafa: matchMode is just ignored here as it is specified in SearchModel for backend.

            'requesterUserName': { value: '', matchMode: 'contains' },
            'siteName': { value: '', matchMode: 'contains' },

            'siteTypeName': { value: '', matchMode: 'contains' },
            'siteLatitude': { value: '', matchMode: 'contains' },
            'siteLongitude': { value: '', matchMode: 'contains' },
            'cityName': { value: '', matchMode: 'contains' },
            'regionName': { value: '', matchMode: 'contains' },
            'provinceName': { value: '', matchMode: 'contains' },
            'vendorName': { value: '', matchMode: 'contains' },
            'statusName': { value: '', matchMode: 'contains' },
            'comment': { value: '', matchMode: 'contains' },
        }

    });
    const [qaCrudService,] = useState(initializeQaCrudService); //Important: always use function instead of direct value (useState(new CrudService('qa'));) 
    const [baseCrudService,] = useState(initializeBaseCrudService); //Important: always use function instead of direct value (useState(new CrudService('qa'));) 
    const formikRef = useRef();

    function initializeQaCrudService() {
        return (new CrudService('qa'));
    }

    function initializeBaseCrudService() {
        return (new CrudService('base'));
    }

    //Mostafa: Initialize the states such as combo-box options here.
    useEffect(() => {

        //Mostafa: Initializing options used in combo boxes.
        qaCrudService.getItems('requestCategory', { sortBy: 'name.asc', size: 1000 }).then(data => {
            if (data) {
                setRequestCategories(data.objects);
            }
        }
        );

        loadSites(''); //loading just a sample initial list of sites for better UX.

    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        loadLazyData(); //when initializing the page, details are not needed.
    }, [lazyParams]);

    const loadLazyData = () => {
        setLoading(true);

        qaCrudService.getItemsWithFiltersAndSort('requestView', getSearchModel(lazyParams))
            .then(data => {
                if (data) {
                    setTotalRecords(data.totalItems);
                    setRequests(data.objects);
                }
                setLoading(false);
            });

    }

    const getSearchModel = (params) => {
        const searchModelObject =
        {
            detailNeeded: params.detailsNeeded,
            pageNumber: params.page,
            pageSize: params.rows,
            sort: [
                {
                    fieldName: params.sortField,
                    sortType: params.sortField == 0 ? '' : (params.sortOrder == 1 ? 'asc' : 'desc')
                }
            ],
            filter: [
                {
                    fieldName: 'categoryId',
                    fieldValue: params.filters.categoryId ? params.filters.categoryId.value : '',
                    operation: 'EQUALS'
                },
                {
                    fieldName: 'categoryName',
                    fieldValue: params.filters.categoryName ? params.filters.categoryName.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'requestDate',
                    fieldValue: params.filters.requestDate ? params.filters.requestDate.value : '',
                    operation: 'GREATER_THAN_EQUALS'
                },
                {
                    fieldName: 'requestDate',
                    fieldValue: params.filters.requestDate ? params.filters.requestDate.value : '',
                    operation: 'LESS_THAN_EQUALS'
                },
                {
                    fieldName: 'plannedDate',
                    fieldValue: params.filters.plannedDate ? params.filters.plannedDate.value : '',
                    operation: 'GREATER_THAN_EQUALS'
                },
                {
                    fieldName: 'plannedDate',
                    fieldValue: params.filters.plannedDate ? params.filters.plannedDate.value : '',
                    operation: 'LESS_THAN_EQUALS'
                },
                {
                    fieldName: 'expiryDate',
                    fieldValue: params.filters.expiryDate ? params.filters.expiryDate.value : '',
                    operation: 'GREATER_THAN_EQUALS'
                },
                {
                    fieldName: 'expiryDate',
                    fieldValue: params.filters.expiryDate ? params.filters.expiryDate.value : '',
                    operation: 'LESS_THAN_EQUALS'
                },
                {
                    fieldName: 'requesterUserName',
                    fieldValue: params.filters.requesterUserName ? params.filters.requesterUserName.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'siteName',
                    fieldValue: params.filters.siteName ? params.filters.siteName.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'siteTypeName',
                    fieldValue: params.filters.siteTypeName ? params.filters.siteTypeName.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'siteLatitude',
                    fieldValue: params.filters.siteLatitude ? params.filters.siteLatitude.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'siteLongitude',
                    fieldValue: params.filters.siteLongitude ? params.filters.siteLongitude.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'cityName',
                    fieldValue: params.filters.cityName ? params.filters.cityName.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'regionName',
                    fieldValue: params.filters.regionName ? params.filters.regionName.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'provinceName',
                    fieldValue: params.filters.provinceName ? params.filters.provinceName.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'vendorName',
                    fieldValue: params.filters.vendorName ? params.filters.vendorName.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'statusName',
                    fieldValue: params.filters.statusName ? params.filters.statusName.value : '',
                    operation: 'like'
                },
                {
                    fieldName: 'comment',
                    fieldValue: params.filters.comment ? params.filters.comment.value : '',
                    operation: 'like'
                },
            ]
        };

        return searchModelObject;
    }
    const isFormFieldValid = (touched, errors, name) => { return Boolean(getIn(touched, name) && getIn(errors, name)) };
    const getFormErrorMessage = (touched, errors, name) => {
        return isFormFieldValid(touched, errors, name) && <small className="p-error">{getIn(errors, name)}</small>;
    };

    const goToLastPageIfNeeded = (newNumberOfObjectsInPage) => {
        let _lazyParams = { ...lazyParams };
        let newPage = 0; //0 just for initialization.
        let newPageCount = 0; //0 just for initialization.
        let newFirst = 0; //0 just for initialization.
        let LazyParamsNeedUpdate = false;
        let newRows = 1; //for now only 1 new onject is added via create dialog.

        if (newNumberOfObjectsInPage === 0) { //Mostafa: this happens if the operation is deletion;
            LazyParamsNeedUpdate = true;
            newPageCount = --_lazyParams.pageCount; //Mostafa: PageCount is not updated correctly after useEffect, so I guess I should manually correct it;
            newPage = _lazyParams.pageCount > 0 ? newPageCount - 1 : 0;  //Mostafa: if page index is > 0 reduce by 1 otherwise return 0;
        }
        else if (newNumberOfObjectsInPage > _lazyParams.rows) { //Mostafa: this happens if the operation is addition;
            LazyParamsNeedUpdate = true;

            newPageCount = Math.ceil((totalRecords + newRows) / _lazyParams.rows);
            newPage = newPageCount - 1; //since page index starts from 0;

            // newPage = _lazyParams.pageCount; //Mostafa: as page index starts with 0, so page count would be new page index in this case;
            // newPageCount = ++_lazyParams.pageCount; //Mostafa: PageCount is not updated correctly after useEffect, so I guess I should manually correct it;
        }
        else {
            LazyParamsNeedUpdate = false;
        }

        if (LazyParamsNeedUpdate) {
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

    const openNew = () => {
        setRequest(emptyRequest);
        setRequestDialog(true);
    }

    const hideDialog = () => {

        setRequest(emptyRequest);
        setRequestCategoryFields([]); //Mostafa: selected category fields also need to be reset.

        setRequestDialog(false);
    }

    const hideDeleteRequestDialog = () => {
        setDeleteRequestDialog(false);
    }

    const hideDeleteRequestsDialog = () => {
        setDeleteRequestsDialog(false);
    }

    const saveRequest = (_request) => {

        //let _request = { ...request }; /* Mostafa: [...] here to copy the object */
        if (request.id) {
            //mostafa: call service put method to update the request.
            qaCrudService.putItem('request', _request, updateResponseCallback);
        }
        else {
            //mostafa: call service post method to create the request.
            qaCrudService.postItem('request', _request, createResponseCallback);
        }
    }

    const updateResponseCallback = (_request, res, success, message) => {
        if (success) {
            let _requests = [...requests]; /* Mostafa: [...] here to copy array */
            const index = findIndexById(request.id);
            _requests[index] = _request;

            setRequests(_requests);
            setRequest(emptyRequest);
            setRequestDialog(false);
            formikRef.current.resetForm();
            setRequestCategoryFields([]); //Mostafa: selected category fields also need to be reset.

            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Request Updated!', life: 5000 }); //Request Updated
        }
        else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 10000 });
        }
    }

    const createResponseCallback = (_request, res, success, message) => {
        if (success) {
            let _requests = [...requests]; /* Mostafa: [...] here to copy array */
            _request.id = res.data.object.id;
            _requests.push(_request);

            setRequests(_requests);

            setRequestDialog(false);
            setRequest(emptyRequest);
            formikRef.current.resetForm();
            setRequestCategoryFields([]); //Mostafa: selected category fields also need to be reset.

            let lastPage_or_first = "first"; //Mostafa: TODO: for now, I hard-coded, but later on, we should parameterize it.
            if (lastPage_or_first === "first") { //Mostafa: For some time-series based pages such as Request, we need to go to first page, loading rows by date descending. so we just make a call to loadLazyData to both show the newly created item at first and load names along with ids.
                let _lazyParams = { ...lazyParams }; //Mostafa: Setting Lazy Params
                _lazyParams.page = 0;
                _lazyParams.first = 0;

                setLazyParams(_lazyParams);
            }
            else { //Mostafa: for some Base entities which are not time-series data, we should usually go to last page to add the created item at the end.
                goToLastPageIfNeeded(_requests.length); //Mostafa: The lazy mode in DataTable component doesn't handle going automatically to next page after page is full I guess; at least so far as I searched. I hope I am not stupid;

                let newCreatedObjects = 1;
                updateTotalRecords(newCreatedObjects);
            }

            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Request Created!', life: 5000 }); //Request Created

        }
        else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 10000 });
        }
    }

    const updateTotalRecords = (_by) => {
        let _newTotalRecord = totalRecords + _by;
        setTotalRecords(_newTotalRecord);
    }

    const editRequest = (request) => {
        setRequest({ ...request });
        initializeDialogForEdit(request);
        setRequestDialog(true);
    }

    const confirmDeleteRequest = (request) => {
        setRequest(request);
        setDeleteRequestDialog(true);
    }

    const deleteRequest = () => {
        let _request = { ...request }; /* Mostafa: [...] here to copy the object */
        setDeleteRequestDialog(false);
        qaCrudService.deleteItem('request', _request, deleteResponseCallback);
    }

    const deleteResponseCallback = (_request, res, success, message) => {
        if (success) {
            let _requests = requests.filter(val => val.id !== request.id);

            setRequests(_requests);
            setRequest(emptyRequest);
            goToLastPageIfNeeded(_requests.length); //Mostafa: The lazy mode in DataTable component doesn't handle going automatically to previous page if the page is empty I guess; at least so far as I searched. I hope I am not stupid;
            let _updateBy = -1; //-1 for created - > means 1 deleted.
            updateTotalRecords(_updateBy);

            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Request Deleted', life: 3000 });
        }
        else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 10000 });
        }
    }

    const deleteSelectedRequests = () => {

        let _selectedRequests = { ...selectedRequests }; /* Mostafa: [...] here to copy the object */
        setDeleteRequestsDialog(false);
        qaCrudService.deleteItems('request', _selectedRequests, deleteMultipleResponseCallback);

    }

    const deleteMultipleResponseCallback = (_selectedRequests, res, success, message) => {
        if (success) {
            let _requests = requests.filter(val => !selectedRequests.includes(val));
            setRequests(_requests);

            let _updateBy = -1 * selectedRequests.length; //to update totalRecords
            updateTotalRecords(_updateBy);

            setSelectedRequests(null);

            goToLastPageIfNeeded(_requests.length); //Mostafa: The lazy mode in DataTable component doesn't handle going automatically to previous page if the page is empty I guess; at least so far as I searched. I hope I am not stupid;

            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Requests Deleted', life: 3000 });
        }
        else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 10000 });
        }
    }

    const findIndexById = (id) => {
        let index = -1;
        for (let i = 0; i < requests.length; i++) {
            if (requests[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    const exportCSV = () => {
        dt.current.exportCSV();
    }

    const confirmDeleteSelected = () => {
        setDeleteRequestsDialog(true);
    }

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    <Button label="Refresh" icon="pi pi-refresh" className="p-button-info mr-2" onClick={loadLazyData} />
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

    const requestCategoryNameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.categoryName}
            </>
        );
    }

    const requestDateBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Request Date</span>

                {rowData.requestDate && //Mostafa: converting ISO format of 2021-12-15T14:59:13.258+00:00 to more readable format: 2021-12-15 14:59
                    rowData.requestDate.substring(0, 10) + " " + rowData.requestDate.substring(11, 16)}
            </>
        );
    }

    const plannedDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.plannedDate}
            </>
        );
    }

    const expiryDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.expiryDate}
            </>
        );
    }

    const requesterUserNameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.requesterUserName}
            </>
        );
    }

    const siteNameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.siteName}
            </>
        );
    }

    const siteTypeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.siteTypeName}
            </>
        );
    }

    const siteLatitudeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.siteLatitude}
            </>
        );
    }

    const siteLongitudeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.siteLongitude}
            </>
        );
    }

    const cityNameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.cityName}
            </>
        );
    }

    const regionNameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.regionName}
            </>
        );
    }

    const provinceNameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.provinceName}
            </>
        );
    }

    const vendorNameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.vendorName}
            </>
        );
    }

    const statusNameBodyTemplate = (rowData) => {
        return (
            <>
                <span className={`task-badge status-${rowData.statusName.toLowerCase()}`}>{rowData.statusName}</span>

            </>
        );
    }

    const commentBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.comment}
            </>
        );
    }

    const chassisNumberBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.dynamicAttrsMap["chassisNumber"]}
            </>
        );
    }

    const supervisorNameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.dynamicAttrsMap["supervisorName"]}
            </>
        );
    }

    const fieldBodyTemplate = (rcField) => {
        return (rowData, column) => {
            const dynamicAttrsMap = rowData.dynamicAttrsMap;
            if (dynamicAttrsMap && rcField.fieldInputType) {
                const propertyValue = dynamicAttrsMap[rcField.fieldPropertyName];
                switch (rcField.fieldInputType) {
                    case 1: //Text Field - String
                        return (<><span className='dynamic_field_content'>{propertyValue}</span></>);
                    case 2: //Text Field - Number
                        return (<><span className='dynamic_field_content'>{propertyValue}</span></>);
                    case 3: //Date
                        return (<><span className='dynamic_field_content'>{propertyValue && //Mostafa: converting ISO format of 2021-12-15T14:59:13.258+00:00 to more readable format: 2021-12-15 14:59
                            propertyValue.substring(0, 10)}</span></>);
                    case 4: //Date-Time
                        return (<><span className='dynamic_field_content'>{propertyValue && //Mostafa: converting ISO format of 2021-12-15T14:59:13.258+00:00 to more readable format: 2021-12-15 14:59
                            propertyValue.substring(0, 10) + " " + propertyValue.substring(11, 16)} </span></>);
                    case 5: //Time
                        return (<><span className='dynamic_field_content'>{propertyValue}</span></>);
                    case 6: //List 
                        return (<><span className='dynamic_field_content'>{propertyValue}</span></>);
                    case 7: //Attachment
                        return (<><span className='dynamic_field_content'>{propertyValue}</span></>);
                }
            }
        }
    }

    //Mostafa: this is to return an Object in an array if the ID matches the given parameter.
    function getNameByValue(arr, value) {
        var foundItem = arr.find(item => { return (item.value === value) })
        if (foundItem)
            return foundItem.name;
    };

    const actionsBodyTemplate = (rowData) => {
        return (
            <div className="actions">
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-success mr-2" onClick={() => editRequest(rowData)} />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={() => confirmDeleteRequest(rowData)} />
            </div>
        );
    }

    function getRequestCategoryFieldSearchModel(requestCategoryId) {
        const searchModelObject =
        {
            pageNumber: 0,
            pageSize: 1000, //Mostafa: 1000 is the maximum but not practical :D
            sort: [
                {
                    fieldName: 'fieldPropertyName',
                    sortType: 'asc'
                }
            ],
            filter: [
                {
                    fieldName: 'requestCategoryId',
                    fieldValue: requestCategoryId,
                    operation: 'EQUALS'
                }
            ]
        };

        return searchModelObject;
    }

    function loadRequestCategoryFields(requestCategoryId, isFilter, editInitializeMode) {
        if (isFilter)
            setLoading(true);

        qaCrudService.getItemsWithFiltersAndSort('requestCategoryFieldView', getRequestCategoryFieldSearchModel(requestCategoryId))
            .then(data => {
                if (data) {
                    if (isFilter)
                        setFilterRequestCategoryFields(data.objects);
                    else {
                        //const rcFields = data.objects;
                        setRequestCategoryFields(data.objects);
                        
                        //Mostafa: for edit, obviously we do not want to initialize dynamic attributes.
                        if (data.objects && !editInitializeMode){ //Mostafa: Initializing the field in the emptyRequest which seems to be necessary for Formik. otherwise Formik doesn't work properly in validation.
                            let _request = { ...request };
                            data.objects.map(reqCatField => {
                                _request.dynamicAttrsMap[reqCatField.fieldPropertyName] = '';
                            });
                            setRequest(_request);
                        }

                        //initilizing (defining) dynamic fields in formik.
                        //rcFields.map(rcf => {formik.setFieldValue("dynamicAttrsMap." + rcf.fieldPropertyName, ''); })    
                    }
                }
                if (isFilter)
                    setLoading(false);
            });
    }

    const handleRequestCategoryFilterChange = (e) => {
        let _lazyParams = { ...lazyParams };
        if (e.value) {
            _lazyParams.detailsNeeded = true; //now details are needed.
            _lazyParams.filters.categoryId.value = e.value; //Mostafa: We have to manually set the value as we are storing the selected value in a state.

            loadRequestCategoryFields(e.value, true, false);
        }
        else { //this happens when the filter is cleared by user.
            let _lazyParams = { ...lazyParams };
            _lazyParams.detailsNeeded = false; //now details are needed.
            _lazyParams.filters.categoryId.value = ''; //Mostafa: We have to manually set the value as we are storing the selected value in a state.
            setFilterRequestCategoryFields(null);
        }

        setLazyParams(_lazyParams);
    }

    //Mostafa: this is to return an Object in an array if the ID matches the given parameter.
    function findObjectById(arr, idToSearch) {
        return arr.find(item => {
            return item.id === idToSearch
        })
    };


    const deleteRequestDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteRequestDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteRequest} />
        </>
    );
    const deleteRequestsDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteRequestsDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteSelectedRequests} />
        </>
    );

    /*Mostafa: aims to fill out the second hand DropDowns, for example: Region is initialized before, So
        , Province should be filled based on selected Region and also cities should be filled based on the selected Province.
        */
    const initializeDialogForEdit = (request) => {
        if (request.categoryId) {
            loadRequestCategoryFields(request.categoryId, false, true);
        }
        else
            setRequestCategoryFields([]); //user has cleared the selected category.

    }

    const requestCategoryItemTemplate = (itemData) => {
        return (
            <span><span className='item_minor'>{itemData.superCategory}</span><span className='item_major'>{itemData.name}</span></span>
        );
    }

    const selectedRequestCategoryValueTemplate = (option, props) => {
        if (option) {
            return (
                <span><span className='item_minor'>{option.superCategory}</span><span className='item_major'>{option.name}</span></span>
            );
        }
        return (
            <span className='p-dropdown-label p-inputtext'>
                {props.placeholder}
            </span>
        );
    }

    const header = (
        <>
            <div className="card">
                <h5 className='independent_header'>Manage Requests</h5>

                <div className="grid p-fluid mt-3">
                    <div className="field col-12 lg:col-4 md:col-6">
                        <span className="p-float-label p-input-icon-right">
                            <Dropdown id="filterRequestCategoryId" name="filterRequestCategoryId" value={lazyParams.filters.categoryId.value} onChange={handleRequestCategoryFilterChange}
                                filter showClear filterBy="name" itemTemplate={requestCategoryItemTemplate} valueTemplate={selectedRequestCategoryValueTemplate}
                                options={requestCategories} optionLabel="name" optionValue="id" />
                            <label htmlFor="filterRequestCategoryId">Request Category Filter</label>
                        </span>
                    </div>
                </div>
                {/* Mostafa: we do not provide global search as of now. 
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." />
                */}

            </div>
        </>
    );


    const siteItemTemplate = (itemData) => {
        return (
            <span><span className='item_major'>{itemData.name}</span><span className='item_minor'>{itemData.siteTypeName}</span></span>
        );
    }

    const siteItemValueTemplate = (option, props) => {
        if (option) {
            return (
                <span><span className='item_major'>{option.name}</span><span className='item_minor'>{option.siteTypeName}</span></span>
            );
        }
        return (
            <span className='p-dropdown-label p-inputtext'>
                {props.placeholder}
            </span>
        );
    }


    function getSiteSearchModel(filter) {
        const searchModelObject =
        {
            pageNumber: 0,
            pageSize: 100, //Mostafa: for better performance, we return maximum of a hundered items into the combo, so the user has to provide narrower filter.
            sort: [
                {
                    fieldName: 'name',
                    sortType: 'asc'
                }
            ],
            filter: [
                {
                    fieldName: 'name',
                    fieldValue: filter,
                    operation: 'like'
                }
            ]
        };

        return searchModelObject;
    }

    function siteFilterChange(e) {
        const filter = e.filter;
        loadSites(filter);
    }

    function loadSites(filter) {
        baseCrudService.getItemsWithFiltersAndSort('siteView', getSiteSearchModel(filter))
            .then(data => {
                if (data) {
                    setSites(data.objects);
                }
            });
    }

    const handleRequestCategoryChange = (e, handleChange, setFieldValue) => {

        let label = e.originalEvent.currentTarget.ariaLabel; //I don't know where is Aria label set, but it's great for this situation.
        setFieldValue("categoryName", label); //Mostafa: Ids are set by formik, but names should be set manually for the DataTable to display correctly.

        if (e.value) {
            loadRequestCategoryFields(e.value, false, false);
        }
        else
            setRequestCategoryFields([]); //user has cleared the selected category.

        //Mostafa: handleChange should be called as last operation to clear required! errors on formik validaiton. not sure why though!!!!
        handleChange(e); //Mostafa: this line is so important; if missed, formik won't set the DropDown Value!
    }

    const onUpload = () => {
        toast.current.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded' });
    }

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
                    {header}
                    {/*Mostafa: lazy="true" to grab the control of pagination, as it shows only received page as totalRecrods by default. */}
                    <DataTable lazy="true" ref={dt} value={requests} selection={selectedRequests} onSelectionChange={(e) => setSelectedRequests(e.value)}
                        dataKey="id" paginator rows={lazyParams.rows} first={lazyParams.first} totalRecords={totalRecords} rowsPerPageOptions={[10, 25, 50]} className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} requests"
                        globalFilter={globalFilter} emptyMessage="No requests found." onPage={onPage}
                        onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
                        onFilter={onFilter} filters={lazyParams.filters} loading={loading} filterDelay={300}>

                        <Column field="categoryName" header="Category" sortable body={requestCategoryNameBodyTemplate} headerStyle={{ width: '10%' }} filterField="categoryName" filter filterPlaceholder="<Category>"> </Column>
                        <Column field="requestDate" header="Request Date" sortable body={requestDateBodyTemplate} headerStyle={{ width: '8%' }} filterField="requestDate" filter filterPlaceholder="<Request Date>"></Column>

                        {//Here goes the dynamic fields

                            filterRequestCategoryFields && filterRequestCategoryFields.map(rcField => {
                                return (
                                    <Column bodyClassName='dynamic_field_column' field={"dynamicAttrsMap." + rcField.fieldPropertyName} header={rcField.fieldLabel} body={fieldBodyTemplate(rcField)}
                                        sortable headerStyle={{ width: '7%' }} filterField={"dynamicAttrsMap." + rcField.fieldPropertyName} filter filterPlaceholder={"<" + rcField.fieldLabel + ">"}></Column>
                                )
                            })

                        }
                        <Column field="requesterUserName" header="Requester" body={requesterUserNameBodyTemplate} sortable headerStyle={{ width: '7%' }} filterField="requesterUserName" filter filterPlaceholder="<Requester User Name>"></Column>
                        <Column field="siteName" header="Site Name" body={siteNameBodyTemplate} sortable headerStyle={{ width: '7%' }} filterField="siteName" filter filterPlaceholder="<Site Name>"></Column>
                        <Column field="siteType" header="Site Type" body={siteTypeBodyTemplate} sortable headerStyle={{ width: '7%' }} filterField="siteType" filter filterPlaceholder="<Site Type>"></Column>
                        <Column field="cityName" header="City" body={cityNameBodyTemplate} sortable headerStyle={{ width: '7%' }} filterField="cityName" filter filterPlaceholder="<City Name>"></Column>
                        <Column field="provinceName" header="Province" body={provinceNameBodyTemplate} sortable headerStyle={{ width: '7%' }} filterField="provinceName" filter filterPlaceholder="<Province Name>"></Column>
                        <Column field="vendorName" header="Vendor" body={vendorNameBodyTemplate} sortable headerStyle={{ width: '7%' }} filterField="vendorName" filter filterPlaceholder="<Vendor Name>"></Column>
                        <Column field="statusName" header="Status" body={statusNameBodyTemplate} sortable headerStyle={{ width: '7%' }} filterField="statusName" filter filterPlaceholder="<Status Name>"></Column>
                        <Column header="Actions" headerStyle={{ width: '8%' }} body={actionsBodyTemplate}></Column>
                    </DataTable>

                    <div className="form-demo">
                        <div className="p-d-flex p-jc-center">
                            <Dialog visible={requestDialog} style={{ width: '50%' }} header="Request Details" modal className="p-fluid" /*footer={requestDialogFooter}*/ onHide={hideDialog}>
                                <Formik
                                    innerRef={formikRef}
                                    initialValues={request || emptyRequest  //Mostafa: edit or new: if request state is avaialble then use it otherwise use emptyRequest.
                                    }
                                    enableReinitialize="true"
                                    onSubmit={(values) => {
                                        console.log('submitting');
                                        saveRequest(values);
                                    }}

                                    validate={(data) => {
                                        let errors = {};

                                        if (!data.siteId) {
                                            errors.siteId = 'Site is required.';
                                        }

                                        if (!data.categoryId) {
                                            errors.categoryId = 'Request Category is required.';
                                        }

                                        //Mostafa: Dynamic validation => as the component is re-rendered, the validation is set again after request category is changed. React is interesting and a lot of repetitive work is done.
                                        if (requestCategoryFields)
                                            requestCategoryFields.map(rcField => {
                                                if (rcField.fieldMandatory) { //1- check Mandatory
                                                    if (!data.dynamicAttrsMap[rcField.fieldPropertyName]) {
                                                        if (!errors.dynamicAttrsMap) //Mostafa: Need to initialize the object in errors, otherwise Formik will not work properly.
                                                            errors.dynamicAttrsMap = {}
                                                        errors.dynamicAttrsMap[rcField.fieldPropertyName] = rcField.fieldLabel + ' is required.';
                                                    }
                                                }
                                                if (rcField.validationRegex) { //2- check Regex
                                                    if (data.dynamicAttrsMap[rcField.fieldPropertyName]) {
                                                        var regex = new RegExp(rcField.validationRegex); //Using RegExp object for dynamic regex patterns.
                                                        if (!regex.test(data.dynamicAttrsMap[rcField.fieldPropertyName])) {
                                                            if (!errors.dynamicAttrsMap) //Mostafa: Need to initialize the object in errors, otherwise Formik will not work properly.
                                                                errors.dynamicAttrsMap = {}

                                                            if (errors.dynamicAttrsMap[rcField.fieldPropertyName]) //add an Line Feed if another errors line already exists, just for a readable multi-line message.
                                                                errors.dynamicAttrsMap[rcField.fieldPropertyName] += '\n';

                                                            errors.dynamicAttrsMap[rcField.fieldPropertyName] = rcField.validationFailedMessage; //Regex validaiton error and help is supposed to be already provided in Field defintion by admin user.
                                                        }
                                                    }
                                                }

                                            });
                                        return errors;
                                    }}
                                >
                                    {({
                                        errors,
                                        handleBlur,
                                        handleChange,
                                        handleSubmit,
                                        resetForm,
                                        setFieldValue,
                                        isSubmitting,
                                        isValid,
                                        dirty,
                                        touched,
                                        values
                                    }) => (
                                        <form autoComplete="off" noValidate onSubmit={handleSubmit} className="card">
                                            <div className="grid p-fluid mt-2">

                                                <div className="field col-12 lg:col-6 md:col-6">
                                                    <span className="p-float-label p-input-icon-right">
                                                        <Dropdown id="siteId" name="siteId" value={values.siteId} onChange={handleChange}
                                                            filter showClear filterBy="name" onFilter={siteFilterChange} filterPlaceholder="<100 sites at Max will show>"
                                                            className={classNames({ 'p-invalid': isFormFieldValid(touched, errors, 'siteId') })}
                                                            itemTemplate={siteItemTemplate} valueTemplate={siteItemValueTemplate}
                                                            options={sites} optionLabel="name" optionValue="id" />
                                                        <label htmlFor="siteId" className={classNames({ 'p-error': isFormFieldValid(touched, errors, 'siteId') })}>Site*</label>
                                                    </span>
                                                    {getFormErrorMessage(touched, errors, 'siteId')}
                                                </div>

                                                <div className="field col-12 lg:col-6 md:col-6">
                                                    <span className="p-float-label p-input-icon-right">
                                                        <Dropdown name="categoryId" id="categoryId" value={values.categoryId} onChange={e => { handleRequestCategoryChange(e, handleChange, setFieldValue) }}
                                                            filter showClear filterBy="name"
                                                            className={classNames({ 'p-invalid': isFormFieldValid(touched, errors, 'categoryId') })}
                                                            itemTemplate={requestCategoryItemTemplate} valueTemplate={selectedRequestCategoryValueTemplate}
                                                            options={requestCategories} optionLabel="name" optionValue="id" />
                                                        <label htmlFor="categoryId" className={classNames({ 'p-error': isFormFieldValid(touched, errors, 'categoryId') })}>Request Category*</label>
                                                    </span>
                                                    {getFormErrorMessage(touched, errors, 'siteId')}
                                                </div>

                                                <div className="field col-12 lg:col-12 md:col-12">
                                                    <span className="p-float-label p-input-icon-right">
                                                        <InputTextarea autoResize id="comment" name="comment" value={values.comment} onChange={handleChange} onBlur={handleBlur}
                                                            className={classNames({ 'p-invalid': isFormFieldValid(touched, errors, 'comment') })} />
                                                        <label htmlFor="comment" className={classNames({ 'p-error': isFormFieldValid(touched, errors, 'comment') })}>Comment</label>
                                                    </span>
                                                </div>
                                                {
                                                    //Here goes the dynamic fields
                                                    requestCategoryFields && requestCategoryFields.map(rcField => {
                                                        return (
                                                            <DynamicField field={rcField} values={values} touched={touched} errors={errors} handleBlur={handleBlur} 
                                                            handleChange={handleChange} isFormFieldValid={isFormFieldValid} getFormErrorMessage={getFormErrorMessage} 
                                                            crudService={qaCrudService} toast={toast} />
                                                        )
                                                    })
                                                }
                                            </div>
                                            <div className="p-dialog-footer">
                                                <Button type="button" label="Cancel" icon="pi pi-times" className="p-button p-component p-button-text"
                                                    onClick={() => {
                                                        resetForm();
                                                        hideDialog();
                                                    }} />
                                                <Button type="submit" label="Save" icon="pi pi-check" className="p-button p-component p-button-text" />
                                            </div>
                                        </form>
                                    )}
                                </Formik>
                            </Dialog>
                        </div>
                        <Dialog visible={deleteRequestDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteRequestDialogFooter} onHide={hideDeleteRequestDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {request && <span>Are you sure you want to delete <b>{request.name}</b>?</span>}
                            </div>
                        </Dialog>

                        <Dialog visible={deleteRequestsDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteRequestsDialogFooter} onHide={hideDeleteRequestsDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {request && <span>Are you sure you want to delete the selected requests?</span>}
                            </div>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    );
}
