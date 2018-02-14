import { DefineModule, createNamespacedHelpers } from 'vuex'
import { VueFilePayload } from '@/parser/vue-file'
import { Template, Element } from '@/parser/template'
import { Prop, Data } from '@/parser/script'
import { ClientConnection } from '@/view/communication'
import { genStyle } from '@/parser/style-codegen'

interface ProjectState {
  document: VueFilePayload | undefined
  selectedPath: number[]
}

interface ProjectGetters {
  template: Template | undefined
  props: Prop[]
  data: Data[]
  styles: string
}

interface ProjectActions {
  init: ClientConnection
  select: Element
}

interface ProjectMutations {
  setDocument: VueFilePayload
  select: Element
}

export const projectHelpers = createNamespacedHelpers<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
>('project')

let connection: ClientConnection

export const project: DefineModule<
  ProjectState,
  ProjectGetters,
  ProjectMutations,
  ProjectActions
> = {
  namespaced: true,

  state: () => ({
    document: undefined,
    selectedPath: []
  }),

  getters: {
    template(state) {
      return state.document && state.document.template
    },

    props(state) {
      return state.document ? state.document.props : []
    },

    data(state) {
      return state.document ? state.document.data : []
    },

    styles(state) {
      return state.document ? genStyle(state.document.styles) : ''
    }
  },

  actions: {
    init({ commit }, conn) {
      connection = conn
      connection.onMessage(data => {
        switch (data.type) {
          case 'InitDocument':
            commit('setDocument', data.vueFile)
            break
          default: // Do nothing
        }
      })
    },

    select({ commit, state }, node) {
      if (!state.document) return

      connection.send({
        type: 'SelectNode',
        uri: state.document.uri,
        path: node.path
      })
      commit('select', node)
    }
  },

  mutations: {
    setDocument(state, vueFile) {
      state.document = vueFile
    },

    select(state, node) {
      state.selectedPath = node.path
    }
  }
}
