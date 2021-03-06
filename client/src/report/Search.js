/**
 * Created by seal on 31/01/2017.
 */

import React from 'react'
import SearchForm from './SearchForm'
import SearchTable from './SearchTable'
import { connect } from 'react-redux'
import { storeSearch } from '../actions'
import moment from 'moment'

class Search extends React.Component {
  search = condition => {
    this.props.dispatch(storeSearch({
      ...condition,
      endDate: moment(condition.endDate).add(1, 'day')
    }))
  }

  render() {
    return (
      <div>
        <h3 className="page-header">输入搜索条件</h3>
        <SearchForm onSubmit={this.search}/>
        <SearchTable/>
      </div>
    )
  }
}

export default connect()(Search)
