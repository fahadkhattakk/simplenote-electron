import React, { Component } from 'react';
import { connect } from 'react-redux';
import onClickOutside from 'react-onclickoutside';
import { includes, isEmpty } from 'lodash';
import format from 'date-fns/format';

import LastSyncTime from '../components/last-sync-time';
import PanelTitle from '../components/panel-title';
import ToggleControl from '../controls/toggle';
import CrossIcon from '../icons/cross';
import getNoteTitleAndPreview from '../utils/note-utils';

import actions from '../state/actions';

import * as S from '../state';
import * as T from '../types';

type StateProps = {
  isMarkdown: boolean;
  isPinned: boolean;
  noteId: T.EntityId;
  note: T.Note;
};

type DispatchProps = {
  markdownNote: (noteId: T.EntityId, shouldEnableMarkdown: boolean) => any;
  onOutsideClick: () => any;
  pinNote: (noteId: T.EntityId, shouldPin: boolean) => any;
};

type Props = StateProps & DispatchProps;

export class NoteInfo extends Component<Props> {
  static displayName = 'NoteInfo';

  handleClickOutside = this.props.onOutsideClick;

  copyNoteLink = (event: React.MouseEvent) => {
    const copyButton = event.currentTarget;
    const previousSibling = copyButton.previousSibling;
    if (null === previousSibling) {
      // @TODO: Handle the failure case - this should never happen
      return;
    }

    const linkArea = previousSibling as HTMLInputElement;

    const { title } = getNoteTitleAndPreview(this.props.note);
    linkArea.value = `[${title}](simplenote://note/${this.props.noteId})`;
    linkArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      // @TODO: Make sure we don't fail - add missing browser compatability?
    }

    linkArea.value = `simplenote://note/${this.props.noteId}`;
    copyButton.focus();
  };

  copyPublishURL = () => {
    this.publishUrlElement.select();

    try {
      document.execCommand('copy');
    } catch (err) {
      return;
    }

    this.copyUrlElement.focus();
  };

  getPublishURL = (url) => {
    return isEmpty(url) ? null : `http://simp.ly/p/${url}`;
  };

  render() {
    const { isMarkdown, isPinned, noteId, note } = this.props;
    const formattedDate =
      note.modificationDate && formatTimestamp(note.modificationDate);
    const isPublished = includes(note.systemTags, 'published');
    const publishURL = this.getPublishURL(note.publishURL);

    return (
      <div className="note-info theme-color-bg theme-color-fg theme-color-border">
        <div className="note-info-panel note-info-stats theme-color-border">
          <div className="note-info-header">
            <PanelTitle headingLevel={2}>Info</PanelTitle>
            <button
              type="button"
              className="about-done button button-borderless"
              onClick={this.handleClickOutside}
            >
              <CrossIcon />
            </button>
          </div>
          {formattedDate && (
            <p className="note-info-item">
              <span className="note-info-item-text">
                <span className="note-info-name">Modified</span>
                <br />
                <span className="note-info-detail">{formattedDate}</span>
              </span>
            </p>
          )}
          <p className="note-info-item">
            <span className="note-info-item-text">
              <span className="note-info-name">Last sync</span>
              <br />
              <span className="note-info-detail">
                <LastSyncTime noteId={noteId} />
              </span>
            </span>
          </p>
          <p className="note-info-item">
            <span className="note-info-item-text">
              <span className="note-info-name">
                {wordCount(note.content)} words
              </span>
            </span>
          </p>
          <p className="note-info-item">
            <span className="note-info-item-text">
              <span className="note-info-name">
                {characterCount(note.content)} characters
              </span>
            </span>
          </p>
        </div>
        <div className="note-info-panel note-info-pin theme-color-border">
          <label className="note-info-item" htmlFor="note-info-pin-checkbox">
            <span className="note-info-item-text">
              <span className="note-info-name">Pin to top</span>
            </span>
            <span className="note-info-item-control">
              <ToggleControl
                id="note-info-pin-checkbox"
                checked={isPinned}
                onChange={this.pinNote}
              />
            </span>
          </label>
        </div>
        <div className="note-info-panel note-info-markdown theme-color-border">
          <label
            className="note-info-item"
            htmlFor="note-info-markdown-checkbox"
          >
            <span className="note-info-item-text">
              <span className="note-info-name">Markdown</span>
              <br />
              <span className="note-info-detail">
                Enable markdown formatting on this note.{' '}
                <a
                  target="_blank"
                  href="http://simplenote.com/help/#markdown"
                  rel="noopener noreferrer"
                >
                  Learn more…
                </a>
              </span>
            </span>
            <span className="note-info-item-control">
              <ToggleControl
                id="note-info-markdown-checkbox"
                checked={isMarkdown}
                onChange={this.markdownNote}
              />
            </span>
          </label>
        </div>
        <div className="note-info-panel note-info-internal-link theme-color-border">
          <span className="note-info-item-text">
            <span className="note-info-name">Internal link</span>
            <div className="note-info-form">
              <input
                className="note-info-detail note-info-link-text"
                value={`simplenote://note/${noteId}`}
                readOnly={true}
                spellCheck={false}
              />
              <button
                type="button"
                className="button button-borderless note-info-copy-button"
                onClick={this.copyNoteLink}
              >
                Copy
              </button>
            </div>
          </span>
        </div>
        {isPublished && (
          <div className="note-info-panel note-info-public-link theme-color-border">
            <span className="note-info-item-text">
              <span className="note-info-name">Public link</span>
              <div className="note-info-form">
                <input
                  ref={(e) => (this.publishUrlElement = e)}
                  className="note-info-detail note-info-link-text"
                  value={publishURL}
                  readOnly={true}
                  spellCheck={false}
                />
                <button
                  ref={(e) => (this.copyUrlElement = e)}
                  type="button"
                  className="button button-borderless note-info-copy-button"
                  onClick={this.copyPublishURL}
                >
                  Copy
                </button>
              </div>
            </span>
          </div>
        )}
      </div>
    );
  }

  pinNote = (shouldPin: boolean) =>
    this.props.pinNote(this.props.noteId, shouldPin);

  markdownNote = (shouldEnableMarkdown: boolean) =>
    this.props.markdownNote(this.props.noteId, shouldEnableMarkdown);
}

function formatTimestamp(unixTime: number) {
  return format(unixTime * 1000, 'MMM d, yyyy h:mm a');
}

// https://github.com/RadLikeWhoa/Countable
function wordCount(content: string) {
  const matches = (content || '')
    .replace(/[\u200B]+/, '')
    .trim()
    .replace(/['";:,.?¿\-!¡]+/g, '')
    .match(/\S+/g);

  return (matches || []).length;
}

// https://mathiasbynens.be/notes/javascript-unicode
const surrogatePairs = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
function characterCount(content: string) {
  return (
    // then get the length
    (content || '')
      // replace every surrogate pair with a BMP symbol
      .replace(surrogatePairs, '_').length
  );
}

const mapStateToProps: S.MapState<StateProps> = ({
  data,
  ui: { openedNote },
}) => {
  const note = data.notes.get(openedNote);

  return {
    noteId: openedNote,
    note: note,
    isMarkdown: note?.systemTags.includes('markdown'),
    isPinned: note?.systemTags.includes('pinned'),
  };
};

const mapDispatchToProps: S.MapDispatch<DispatchProps> = {
  markdownNote: actions.data.markdownNote,
  onOutsideClick: actions.ui.toggleNoteInfo,
  pinNote: actions.data.pinNote,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(onClickOutside(NoteInfo));
