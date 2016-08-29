import cs from 'classnames'
import { action } from 'mobx'
import React, { Component } from 'react'
import App from '../lib/app'
import state from '../lib/state'
import { observer } from 'mobx-react'

@observer
class Login extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isLoggingIn: false,
      error: null,
    }
  }

  render () {
    return (
      <div id='login'>
        <div className='login-img-wrapper'>
          <img src='/img/cypress-inverse.png' />
        </div>
        <div className='login-content'>
          {this._error()}
          <button
            className={cs('btn btn-login btn-block', {
              disabled: this.state.isLoggingIn,
            })}
            onClick={this._login}
            disabled={this.state.isLoggingIn}
          >
            <i className='fa fa-github'></i>{' '}
            Log In with GitHub
          </button>
          {this.state.isLoggingIn ?
            <div className='login-spinner'>
              <i className='fa fa-spinner fa-spin'></i>{' '}
              Logging in...
            </div>
          : null }
          <a className='helper-docs-link' onClick={this._openHelp}>
            <i className='fa fa-question-circle'></i>{' '}
            Need help?
          </a>
        </div>
      </div>
    )
  }

  _login = (e) => {
    e.preventDefault()

    const alreadyOpen = (err) => {
      return err && err.alreadyOpen
    }

    return App.ipc('window:open', {
      position: 'center',
      focus: true,
      width: 1000,
      height: 635,
      preload: false,
      title: 'Login',
      type: 'GITHUB_LOGIN',
    })
    .then(action('login:window:opened', (code) => {
      // TODO: supposed to focus the window here!
      // i think this is for linux
      // App.execute 'gui:focus'
      this.setState({ isLoggingIn: true })

      return App.ipc('log:in', code)
    }))
    .then(action('logged:in', (user) => {
      return state.setUser(user)
    }))
    .catch(alreadyOpen, (err) => {
      return // do nothing if we're already open!
    })
    .catch(action('error:at:login', (err) => {
      return this.setState({
        isLoggingIn: false,
        error: err,
      })
    }))
  }

  _error () {
    const error = this.state.error
    if (!error) return null

    return (
      <div className='alert alert-danger'>
        <p>
          <i className='fa fa-warning'></i>{' '}
          <strong>Can't Log In</strong>
        </p>
        <p>{this._errorMessage(error.message)}</p>
        {error.statusCode === 401 ?
          <p>
            <a onClick={this._openAuthDoc}>
              <i className='fa fa-question-circle'></i>{' '}
              Why am I not authorized?
            </a>
          </p>
        : null}
      </div>
    )
  }

  _errorMessage (message) {
    function createMarkup () {
      return {
        __html: message.replace('\n', '<br /><br />'),
      }
    }

    return (
      <span dangerouslySetInnerHTML={createMarkup()} />
    )
  }

  _openHelp () {
    App.ipc('external:open', 'https://docs.cypress.io')
  }

  _openAuthDoc () {
    App.ipc('external:open', 'https://on.cypress.io/guides/installing-and-running#section-your-email-has-not-been-authorized-')
  }
}

export default Login
