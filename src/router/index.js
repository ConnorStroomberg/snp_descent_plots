import Vue from 'vue'
import Router from 'vue-router'
import SnpDescentPlots from 'components/SnpDescentPlots'
import { INITIAL_STATE } from '../store/state'

Vue.use(Router)
export default new Router({
  mode: 'history',
  base: INITIAL_STATE.baseUrl,
  routes: [
    {
      path: '/',
      component: SnpDescentPlots
    }
  ]
})
