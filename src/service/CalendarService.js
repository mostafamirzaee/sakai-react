import axios from 'axios';

export class CalendarService {


  //TODO: Mostafa: we might want to read from  backend. but for now I read from data/json files.
  getHolidayOptions(){
    return fetch('data/holidayOptions.json', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }

    }).then(res => res.json()).then(d => d.data);
  }

  getCalendars(params) {
      {/*(encodeURIComponent(k)==="rows"?"size":encodeURIComponent(k)) */}
      const queryParams = Object.keys(params).map(k =>k + '=' + params[k]).join('&');
      return axios.get(`http://localhost:8080/base/calendar?${queryParams}`).then(res => res.data);
  }

  getCalendarsWithFiltersAndSort(params) {
    {/*(encodeURIComponent(k)==="rows"?"size":encodeURIComponent(k)) */}
    
    const searchModelObject = 
      { 
        sort: [
          {fieldName: params.sortField,
          sortType: params.sortField==0?'':(params.sortOrder==1?'asc':'desc')}
        ],
        filter: [
          {
          fieldName: 'date',
          fieldValue: params.filters.startDate?params.filters.startDate.value:'',
          operation: 'GREATER_THAN_EQUALS'
          },
          {
            fieldName: 'date',
            fieldValue: params.filters.endDate?params.filters.endDate.value:'',
            operation: 'LESS_THAN_EQUALS'
          },
          {
            fieldName: 'isHoliday',
            fieldValue: params.filters.isHoliday? (params.filters.isHoliday.value.startsWith("Y")?true:(params.filters.isHoliday.value.startsWith("N")?false:'')):'',
            operation: 'equals'
          },
          {
            fieldName: 'description',
            fieldValue: params.filters.description?params.filters.description.value:'',
            operation: 'like'
          }
        ],
        pageNumber: params.page,
        pageSize: params.rows
    };
    //const paramsSearchModel = {searchModel: JSON.stringify(searchModelObject)};
    //const queryParams = Object.keys(paramsSearchModel).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(paramsSearchModel[k])).join('&');
    return axios.post('http://localhost:8080/base/calendar/search2', searchModelObject).then(res => res.data)
    .catch(error => {
        if (error.response) {
            // Request made and server responded
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
          }
      });
  }

  putCalendar(_calendar, responseCallback) {
    return axios.put('http://localhost:8080/base/calendar/', _calendar).then(res =>responseCallback(_calendar, res, true, "Calendar Updated!"))
    .catch(error => {
        if (error.response) {
            // Request made and server responded
            responseCallback(_calendar, error.response, false, "Server responded with error:" + error.response.data);
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            responseCallback(_calendar, error, false, "Server didn't respond at all!");
            console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            responseCallback(_calendar, error, false, "Something happened in setting up the request that triggered an Error!");
            console.log('Error', error.message);
          }
      });
  }

  postCalendar(_calendar, responseCallback) {
      return axios.post('http://localhost:8080/base/calendar/', _calendar).then(res =>responseCallback(_calendar, res, true, "Calendar Added!"))
      .catch(error => {
          if (error.response) {
              // Request made and server responded
              responseCallback(_calendar, error.response, false, "Server responded with error:" + error.response.data);
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              // The request was made but no response was received
              responseCallback(_calendar, error, false, "Server didn't respond at all!");
              console.log(error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              responseCallback(_calendar, error, false, "Something happened in setting up the request that triggered an Error!");
              console.log('Error', error.message);
            }
        });

    }

  deleteCalendar(_calendar, responseCallback) {
      
      return axios.delete('http://localhost:8080/base/calendar/' + _calendar.id)
      .then(res =>responseCallback(_calendar, res, true, "Calendar Deleted!"))
      .catch(error => {
          if (error.response) {
              // Request made and server responded
              responseCallback(_calendar, error.response, false, "Server responded with error:" + error.response.data);
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              // The request was made but no response was received
              responseCallback(_calendar, error, false, "Server didn't respond at all!");
              console.log(error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              responseCallback(_calendar, error, false, "Something happened in setting up the request that triggered an Error!");
              console.log('Error', error.message);
            }
        }
      );
   }
    
   deleteCalendars(_selectedCalendars, responseCallback) {

        const calendarIds = Object.keys(_selectedCalendars).map(k =>_selectedCalendars[k].id).join(',');
        //const json = JSON.stringify({ids: [calendarIds]});
        return axios.delete('http://localhost:8080/base/calendar/deleteAllByIdInBatch', {data: {ids: [calendarIds]}}).then(res =>responseCallback(_selectedCalendars, res, true, "Calendars Deleted!"))
        .catch(error => {
            if (error.response) {
                // Request made and server responded
                responseCallback(_selectedCalendars, error.response, false, "Server responded with error:" + error.response.data);
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
              } else if (error.request) {
                // The request was made but no response was received
                responseCallback(_selectedCalendars, error, false, "Server didn't respond at all!");
                console.log(error.request);
              } else {
                // Something happened in setting up the request that triggered an Error
                responseCallback(_selectedCalendars, error, false, "Something happened in setting up the request that triggered an Error!");
                console.log('Error', error.message);
              }
          });
    }
    

    /*TODO: Mostafa: include Access Token/Ahtorization Code in the header */
    includeHeaders() {
        const headers = { 
            'Authorization': 'Bearer my-token',
            'My-Custom-Header': 'foobar'
        };
        return headers;
    }

}
